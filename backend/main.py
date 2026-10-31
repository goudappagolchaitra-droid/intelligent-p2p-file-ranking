
import os
import hashlib
import jwt
import secrets
from pathlib import Path
# from uuid import uuid4
from uuid import uuid4, uuid5, NAMESPACE_URL
from datetime import datetime, timezone, timedelta

from fastapi import (
    FastAPI,
    HTTPException,
    UploadFile,
    File,
    Form,
    Depends,
        Header
)

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from pydantic import BaseModel, Field
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from dotenv import load_dotenv
from pwdlib import PasswordHash


# ==========================================
# ENVIRONMENT VARIABLES
# ==========================================

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
PEER_AGENT_SECRET = os.getenv("PEER_AGENT_SECRET")

# ==========================================
# APPLICATION
# ==========================================

app = FastAPI(
    title="PeerRank API",
    version="2.2.0"
)


# ==========================================
# PASSWORD SECURITY
# ==========================================

password_hash = PasswordHash.recommended()


# ==========================================
# JWT SETTINGS
# ==========================================

JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 30


def create_access_token(user_id: str):

    if not JWT_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="JWT_SECRET_KEY is missing from .env"
        )

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": user_id,
        "exp": expire
    }

    token = jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )

    return token
# ==========================================
# JWT TOKEN VERIFICATION
# ==========================================

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    if not JWT_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="JWT_SECRET_KEY is missing."
        )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token."
            )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token."
        )

    try:
        user = get_users_collection().find_one({
            "id": user_id
        })

        if not user:
            raise HTTPException(
                status_code=401,
                detail="User account not found."
            )

        return {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"]
        }

    except PyMongoError:
        raise HTTPException(
            status_code=500,
            detail="Could not verify user."
        )

# ==========================================
# PEER AGENT AUTHENTICATION
# ==========================================

def verify_peer_agent(
    agent_secret: str = Header(
        default="",
        alias="X-Peer-Agent-Secret"
    )
):
    if not PEER_AGENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Peer agent secret is not configured."
        )

    if not agent_secret or not secrets.compare_digest(
        agent_secret,
        PEER_AGENT_SECRET
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid peer agent authentication."
        )

    return True
# ==========================================
# CORS CONFIGURATION
# ==========================================

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173"
)

ALLOWED_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in FRONTEND_URL.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# ==========================================
# FILE STORAGE
# ==========================================

UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ==========================================
# MONGODB CONNECTION
# ==========================================

client = None


def get_database():

    global client

    if not MONGODB_URI:
        raise HTTPException(
            status_code=500,
            detail="MONGODB_URI is missing. Check your .env file."
        )

    try:

        if client is None:
            client = MongoClient(
                MONGODB_URI,
                serverSelectionTimeoutMS=5000
            )

        client.admin.command("ping")

        return client["peerrank"]

    except PyMongoError:

        client = None

        raise HTTPException(
            status_code=503,
            detail="MongoDB connection failed. Check Atlas settings."
        )


# ==========================================
# DATABASE COLLECTIONS
# ==========================================

def get_peers_collection():
    return get_database()["peers"]


def get_files_collection():
    return get_database()["files"]


def get_users_collection():
    return get_database()["users"]


# ==========================================
# USER MODELS
# ==========================================

class UserRegistration(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=100
    )

    email: str

    password: str = Field(
        min_length=8,
        max_length=128
    )


class UserLogin(BaseModel):

    email: str
    password: str


# ==========================================
# USER REGISTRATION
# ==========================================

@app.post("/auth/register")
def register_user(data: UserRegistration):

    collection = get_users_collection()

    name = data.name.strip()
    email = data.email.strip().lower()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Name cannot be empty."
        )

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email cannot be empty."
        )

    try:

        # Check existing email
        existing_user = collection.find_one({
            "email": email
        })

        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="Email already registered."
            )

        # Hash password using Argon2
        hashed_password = password_hash.hash(
            data.password
        )

        # Create user
        user = {
            "id": str(uuid4()),
            "name": name,
            "email": email,
            "password_hash": hashed_password,
            "created_at": datetime.now(
                timezone.utc
            ).isoformat()
        }

        collection.insert_one(user)

        return {
            "message": "Account created successfully.",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"]
            }
        }

    except PyMongoError:

        raise HTTPException(
            status_code=500,
            detail="Could not create account."
        )


# ==========================================
# USER LOGIN
# ==========================================

@app.post("/auth/login")
def login_user(data: UserLogin):

    collection = get_users_collection()

    email = data.email.strip().lower()

    try:

        # Find user
        user = collection.find_one({
            "email": email
        })

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password."
            )

        # Verify password
        if not password_hash.verify(
            data.password,
            user["password_hash"]
        ):

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password."
            )

        # Generate JWT token
        access_token = create_access_token(
            user["id"]
        )

        return {
            "message": "Login successful.",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"]
            }
        }

    except PyMongoError:

        raise HTTPException(
            status_code=500,
            detail="Could not process login."
        )


# ==========================================
# HOME
# ==========================================

@app.get("/")
def home():

    return {
        "message": "PeerRank API is running",
        "status": "success",
        "database": "MongoDB Atlas"
    }
# ==========================================
# GET CURRENT AUTHENTICATED USER
# ==========================================

@app.get("/auth/me")
def get_my_account(
    current_user: dict = Depends(get_current_user)
):

    return {
        "message": "Authentication successful.",
        "user": current_user
    }

# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/health")
def health():

    get_database()

    return {
        "status": "healthy",
        "database": "connected"
    }


# ==========================================
# PEER REGISTRATION MODEL
# ==========================================

class PeerRegistration(BaseModel):

    peer_name: str
    ip_address: str

    response_time_ms: float = Field(ge=0)

    upload_speed_mbps: float = Field(ge=0)

    availability: float = Field(
        ge=0,
        le=100
    )

    active_transfers: int = Field(
        default=0,
        ge=0
    )
# ==========================================
# BROWSER PEER MODEL
# ==========================================

class BrowserPeerHeartbeat(BaseModel):

    device_id: str = Field(
        min_length=16,
        max_length=100
    )

    peer_name: str = Field(
        default="Browser peer",
        min_length=2,
        max_length=100
    )

# ==========================================
# PEER PERFORMANCE SCORE
# ==========================================

def calculate_peer_score(peer):

    response_time = max(
        0,
        float(peer.get("response_time_ms", 0))
    )

    upload_speed = max(
        0,
        float(peer.get("upload_speed_mbps", 0))
    )

    availability = min(
        100,
        max(0, float(peer.get("availability", 0)))
    )

    active_transfers = max(
        0,
        int(peer.get("active_transfers", 0))
    )

    # Individual scores
    latency_score = max(
        0,
        100 - response_time
    )

    speed_score = min(
        100,
        upload_speed * 10
    )

    availability_score = availability

    workload_score = max(
        0,
        100 - active_transfers * 20
    )

    # Weighted final score
    final_score = (
        latency_score * 0.30
        + speed_score * 0.30
        + availability_score * 0.25
        + workload_score * 0.15
    )

    return {
        "latency_score": round(latency_score, 2),
        "speed_score": round(speed_score, 2),
        "availability_score": round(availability_score, 2),
        "workload_score": round(workload_score, 2),
        "final_score": round(final_score, 2)
    }


# ==========================================
# REGISTER PEER
# ==========================================

@app.post("/peers/register")
def register_peer(
    data: PeerRegistration,
    current_user: dict = Depends(get_current_user)
):

    collection = get_peers_collection()

    peer_id = str(uuid4())

    peer = {
        "id": peer_id,
        **data.model_dump(),
        "status": "Online",
        "last_seen": datetime.now(
            timezone.utc
        ).isoformat()
    }

    try:

        collection.insert_one({
            "_id": peer_id,
            **peer
        })

        return {
            "message": "Peer registered successfully",
            "peer": peer
        }

    except PyMongoError:

        raise HTTPException(
            status_code=500,
            detail="Could not save peer to MongoDB."
        )


# ==========================================
# PEER HEARTBEAT
# ==========================================

@app.post("/peers/heartbeat/{peer_id}")
def peer_heartbeat(
    peer_id: str,
    agent_authenticated: bool = Depends(verify_peer_agent)
):

    collection = get_peers_collection()

    try:

        current_time = datetime.now(
            timezone.utc
        ).isoformat()

        result = collection.update_one(
            {"_id": peer_id},
            {
                "$set": {
                    "status": "Online",
                    "last_seen": current_time
                }
            }
        )

        if result.matched_count == 0:

            raise HTTPException(
                status_code=404,
                detail="Peer not found."
            )

        return {
            "message": "Heartbeat received successfully",
            "peer_id": peer_id,
            "status": "Online",
            "last_seen": current_time
        }

    except PyMongoError:

        raise HTTPException(
            status_code=500,
            detail="Could not update peer heartbeat."
        )

# ==========================================
# AUTOMATIC BROWSER PEER REGISTRATION
# ==========================================

@app.post("/peers/browser/heartbeat")
def browser_peer_heartbeat(
    data: BrowserPeerHeartbeat,
    current_user: dict = Depends(get_current_user)
):

    collection = get_peers_collection()

    # Generate a stable peer ID for this user's browser
    peer_id = str(
        uuid5(
            NAMESPACE_URL,
            f"peerrank:{current_user['id']}:{data.device_id}"
        )
    )

    current_time = datetime.now(
        timezone.utc
    ).isoformat()

    peer = {
        "id": peer_id,
        "owner_id": current_user["id"],
        "device_id": data.device_id,
        "peer_name": data.peer_name.strip(),
        "response_time_ms": 0,
        "upload_speed_mbps": 0,
        "availability": 100,
        "active_transfers": 0,
        "status": "Online",
        "last_seen": current_time
    }

    try:

        collection.update_one(
            {"_id": peer_id},
            {
                "$set": {
                    key: value
                    for key, value in peer.items()
                    if key != "id"
                },
                "$setOnInsert": {
                    "_id": peer_id
                }
            },
            upsert=True
        )

        return {
            "message": "Browser peer is online",
            "peer": {
                "id": peer_id,
                "peer_name": peer["peer_name"],
                "status": "Online",
                "last_seen": current_time
            }
        }

    except PyMongoError:

        raise HTTPException(
            status_code=500,
            detail="Could not register browser peer."
        )
# ==========================================
# GET ALL PEERS
# UPDATE ONLINE / OFFLINE STATUS
# ==========================================


@app.get("/peers")
def get_peers(
    current_user: dict = Depends(get_current_user)
):
    collection = get_peers_collection()

    try:
        now = datetime.now(timezone.utc)

        peers = list(
            collection.find(
                {},
                {
                    "_id": 1,
                    "id": 1,
                    "peer_name": 1,
                    "response_time_ms": 1,
                    "upload_speed_mbps": 1,
                    "availability": 1,
                    "active_transfers": 1,
                    "status": 1,
                    "last_seen": 1
                }
            )
        )

        public_peers = []

        for peer in peers:
            peer_id = peer.get("id") or str(peer["_id"])

            last_seen = peer.get("last_seen")
            status = "Unknown"

            if last_seen:
                try:
                    if isinstance(last_seen, datetime):
                        last_seen_time = last_seen
                    else:
                        last_seen_time = datetime.fromisoformat(
                            str(last_seen).replace("Z", "+00:00")
                        )

                    if last_seen_time.tzinfo is None:
                        last_seen_time = last_seen_time.replace(
                            tzinfo=timezone.utc
                        )

                    elapsed = (
                        now - last_seen_time
                    ).total_seconds()

                    status = (
                        "Online" if elapsed <= 60 else "Offline"
                    )

                    collection.update_one(
                        {"_id": peer["_id"]},
                        {"$set": {"status": status}}
                    )

                except (ValueError, TypeError):
                    status = "Unknown"

            public_peers.append({
                "id": peer_id,
                "peer_name": peer.get("peer_name", "Unknown peer"),
                "response_time_ms": peer.get("response_time_ms", 0),
                "upload_speed_mbps": peer.get("upload_speed_mbps", 0),
                "availability": peer.get("availability", 0),
                "active_transfers": peer.get("active_transfers", 0),
                "status": status,
                "last_seen": last_seen
            })

        return public_peers

    except PyMongoError:
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve peers."
        )


# ==========================================
# GET ONLINE PEER RANKINGS
# ==========================================

@app.get("/peers/ranking")
def get_ranking(
    current_user: dict = Depends(get_current_user)
):

    collection = get_peers_collection()

    try:

        now = datetime.now(timezone.utc)

        peers = list(
            collection.find(
                {},
                {"_id": 0}
            )
        )

        ranked = []

        for peer in peers:

            last_seen = peer.get("last_seen")

            if not last_seen:
                continue

            try:

                last_seen_time = datetime.fromisoformat(
                    last_seen
                )

                if last_seen_time.tzinfo is None:

                    last_seen_time = last_seen_time.replace(
                        tzinfo=timezone.utc
                    )

            except (ValueError, TypeError):

                continue

            elapsed = (
                now - last_seen_time
            ).total_seconds()

            if elapsed > 60:

                peer["status"] = "Offline"

                collection.update_one(
                    {"id": peer["id"]},
                    {
                        "$set": {
                            "status": "Offline"
                        }
                    }
                )

                continue

            peer["status"] = "Online"

            scores = calculate_peer_score(peer)

            result = peer.copy()

            result["score"] = scores["final_score"]

            result["performance"] = scores

            ranked.append(result)

        # Highest score first
        ranked.sort(
            key=lambda peer: peer["score"],
            reverse=True
        )

        # Assign ranks
        for index, peer in enumerate(ranked):

            peer["rank"] = index + 1

        return ranked

    except PyMongoError:

        raise HTTPException(
            status_code=500,
            detail="Could not retrieve peer rankings."
        )


# ==========================================
# UPLOAD FILE
# ==========================================


@app.post("/files/upload")
async def upload_file(
    file: UploadFile = File(...),
    peer_id: str = Form(default=""),
    current_user: dict = Depends(get_current_user)
):
    files_collection = get_files_collection()

    file_id = str(uuid4())

    # Safe filename
    original_name = (
        file.filename or "uploaded_file"
    ).replace("\\", "/")

    original_name = Path(original_name).name

    extension = Path(original_name).suffix
    stored_filename = f"{file_id}{extension}"
    file_path = UPLOAD_DIR / stored_filename

    sha256_hash = hashlib.sha256()
    file_size = 0

    try:
        # Save file and calculate hash
        with open(file_path, "wb") as destination:
            while True:
                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                destination.write(chunk)
                sha256_hash.update(chunk)
                file_size += len(chunk)

        file_data = {
            "id": file_id,
            "owner_id": current_user["id"],
            "filename": original_name,
            "stored_filename": stored_filename,
            "peer_id": peer_id,
            "content_type": (
                file.content_type
                or "application/octet-stream"
            ),
            "size_bytes": file_size,
            "sha256": sha256_hash.hexdigest(),
            "uploaded_at": datetime.now(
                timezone.utc
            ).isoformat()
        }

        files_collection.insert_one({
            "_id": file_id,
            **file_data
        })

        return {
            "message": "File uploaded successfully",
            "file": {
                key: value
                for key, value in file_data.items()
                if key != "stored_filename"
            }
        }

    except PyMongoError:
        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="Could not save file metadata to MongoDB."
        )

    except OSError:
        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="Could not save the uploaded file."
        )

    finally:
        await file.close()


# ==========================================
# LIST UPLOADED FILES
# ==========================================


@app.get("/files")
def get_files(
    current_user: dict = Depends(get_current_user)
):
    collection = get_files_collection()

    try:
        return list(
            collection.find(
                {"owner_id": current_user["id"]},
                {
                    "_id": 0,
                    "stored_filename": 0
                }
            )
        )

    except PyMongoError:
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve files."
        )



# ==========================================
# DOWNLOAD FILE
# ==========================================


@app.get("/files/{file_id}/download")
def download_file(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    collection = get_files_collection()

    try:
        file_data = collection.find_one({
            "_id": file_id,
            "owner_id": current_user["id"]
        })

        if not file_data:
            raise HTTPException(
                status_code=404,
                detail="File not found."
            )

        file_path = (
            UPLOAD_DIR
            / file_data["stored_filename"]
        )

        if not file_path.is_file():
            raise HTTPException(
                status_code=404,
                detail="File is missing from server storage."
            )

        return FileResponse(
            path=str(file_path),
            filename=file_data["filename"],
            media_type=file_data.get(
                "content_type",
                "application/octet-stream"
            )
        )

    except PyMongoError:
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve file information."
        )

# ==========================================
# VERIFY FILE INTEGRITY USING SHA-256
# ==========================================


@app.get("/files/{file_id}/verify")
def verify_file(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    collection = get_files_collection()

    try:
        file_data = collection.find_one({
            "_id": file_id,
            "owner_id": current_user["id"]
        })

        if not file_data:
            raise HTTPException(
                status_code=404,
                detail="File not found."
            )

        file_path = (
            UPLOAD_DIR
            / file_data["stored_filename"]
        )

        if not file_path.is_file():
            raise HTTPException(
                status_code=404,
                detail="File is missing from server storage."
            )

        sha256_hash = hashlib.sha256()

        with open(file_path, "rb") as uploaded_file:
            for chunk in iter(
                lambda: uploaded_file.read(1024 * 1024),
                b""
            ):
                sha256_hash.update(chunk)

        current_hash = sha256_hash.hexdigest()
        original_hash = file_data["sha256"]

        is_valid = current_hash == original_hash

        return {
            "file_id": file_id,
            "filename": file_data["filename"],
            "integrity": (
                "Verified" if is_valid else "Failed"
            ),
            "is_valid": is_valid,
            "original_sha256": original_hash,
            "current_sha256": current_hash
        }

    except PyMongoError:
        raise HTTPException(
            status_code=500,
            detail="Could not verify file information."
        )
