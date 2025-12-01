# cv/detector.py
from logging_config.logger import get_logger
cvlog = get_logger("cv")

import os
import cv2
import numpy as np
from typing import Dict, List, Any

# Try YOLOv8 (best case)
YOLO_AVAILABLE = False
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
    cvlog.info("YOLOv8 available for CV detection.")
except Exception as e:
    cvlog.warning(f"YOLOv8 not available. Falling back. error={e}")

# Try MobileNet-SSD
SSD_AVAILABLE = False
SSD_MODEL = None
SSD_CONFIG = None

SSD_PROTO = "cv/models/MobileNetSSD_deploy.prototxt"
SSD_MODEL_FILE = "cv/models/MobileNetSSD_deploy.caffemodel"

SSD_CLASSES = [
    "background", "aeroplane", "bicycle", "bird", "boat", "bottle",
    "bus", "car", "cat", "chair", "cow", "diningtable", "dog", "horse",
    "motorbike", "person", "pottedplant", "sheep", "sofa", "train",
    "tvmonitor"
]

# Load SSD model if files exist
if os.path.exists(SSD_PROTO) and os.path.exists(SSD_MODEL_FILE):
    try:
        SSD_MODEL = cv2.dnn.readNetFromCaffe(SSD_PROTO, SSD_MODEL_FILE)
        SSD_AVAILABLE = True
        cvlog.info("Loaded MobileNet-SSD model successfully.")
    except Exception as e:
        cvlog.error(f"Failed to load MobileNet-SSD. error={e}")
else:
    cvlog.warning("MobileNet-SSD model files not found. SSD disabled.")

# ---------------------------
# 1. DEMO CLASS MAPPING
# ---------------------------

DEMO_ITEMS = {
    "burger": {"keywords": ["burger", "sandwich", "food"]},
    "fries": {"keywords": ["fries", "potato", "finger food"]},
    "cola": {"keywords": ["bottle", "cup", "drink"]},
}

# ---------------------------
# 2. YOLOv8 DETECTION
# ---------------------------

def detect_yolo(img_path: str) -> List[str]:
    cvlog.info("Running YOLOv8 detection", extra={"image_path": img_path})

    model = YOLO("cv/models/food_yolo.pt")
    results = model(img_path)[0]

    labels = []
    for box in results.boxes:
        cls_id = int(box.cls)
        label = results.names.get(cls_id, "")
        labels.append(label.lower())

    cvlog.info("YOLOv8 detection results", extra={"detected": labels})
    return labels

# ---------------------------
# 3. SSD DETECTION
# ---------------------------

def detect_ssd(img_path: str) -> List[str]:
    cvlog.info("Running SSD detection", extra={"image_path": img_path})

    image = cv2.imread(img_path)
    if image is None:
        cvlog.error("Failed to load image for SSD", extra={"image_path": img_path})
        return []

    (h, w) = image.shape[:2]

    blob = cv2.dnn.blobFromImage(
        cv2.resize(image, (300, 300)),
        0.007843, (300, 300), 127.5
    )
    SSD_MODEL.setInput(blob)
    detections = SSD_MODEL.forward()

    labels = []
    for i in range(detections.shape[2]):
        confidence = detections[0, 0, i, 2]
        if confidence > 0.5:
            idx = int(detections[0, 0, i, 1])
            cls = SSD_CLASSES[idx].lower()

            if cls in ["bottle", "cup"]:
                labels.append("cola")  # Map bottle/cup → drink

    cvlog.info("SSD detection results", extra={"detected": labels})
    return labels

# ---------------------------
# 4. MOCK DETECTOR
# ---------------------------

def detect_mock(img_path: str, sample_hint: str = None) -> List[str]:
    cvlog.warning(
        "Using MOCK detection",
        extra={"image_path": img_path, "sample_hint": sample_hint}
    )

    if sample_hint == "fries_missing":
        return ["burger"]

    if sample_hint == "only_drink":
        return ["cola"]

    if sample_hint == "everything_ok":
        return ["burger", "fries", "cola"]

    # default mock
    return ["burger", "fries"]

# ---------------------------
# 5. UNIFIED DETECTION PIPELINE
# ---------------------------

def detect_items(img_path: str, sample_hint: str = None) -> List[str]:
    """
    Unified entrypoint with prioritized fallback:
        1. YOLOv8
        2. MobileNet SSD
        3. Mock detection
    """

    cvlog.info(
        "Image received for CV detection",
        extra={"image_path": img_path, "hint": sample_hint}
    )

    # ---- Step 1: YOLOv8 ----
    if YOLO_AVAILABLE and os.path.exists("cv/models/food_yolo.pt"):
        try:
            cvlog.info("Attempting YOLOv8 detection...")
            return detect_yolo(img_path)
        except Exception as e:
            cvlog.error(
                "YOLOv8 failed, falling back to SSD.",
                extra={"error": str(e)}
            )

    # ---- Step 2: SSD ----
    if SSD_AVAILABLE:
        try:
            cvlog.info("Attempting SSD detection...")
            return detect_ssd(img_path)
        except Exception as e:
            cvlog.error(
                "SSD detection failed, falling back to mock.",
                extra={"error": str(e)}
            )

    # ---- Step 3: Mock fallback ----
    cvlog.warning("All CV models unavailable. Using mock pipeline.")
    result = detect_mock(img_path, sample_hint)

    cvlog.info("Mock detection results", extra={"detected": result})
    return result
