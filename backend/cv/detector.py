# cv/detector.py

import os
import cv2
import numpy as np
from typing import Dict, List, Any

# Try YOLOv8 (best case)
YOLO_AVAILABLE = False
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except Exception:
    YOLO_AVAILABLE = False

# Try MobileNet-SSD
SSD_AVAILABLE = False
SSD_MODEL = None
SSD_CONFIG = None

# Load SSD (if files exist)
SSD_PROTO = "cv/models/MobileNetSSD_deploy.prototxt"
SSD_MODEL_FILE = "cv/models/MobileNetSSD_deploy.caffemodel"
SSD_CLASSES = [
    "background", "aeroplane", "bicycle", "bird", "boat", "bottle",
    "bus", "car", "cat", "chair", "cow", "diningtable", "dog", "horse",
    "motorbike", "person", "pottedplant", "sheep", "sofa", "train",
    "tvmonitor"
]

if os.path.exists(SSD_PROTO) and os.path.exists(SSD_MODEL_FILE):
    SSD_MODEL = cv2.dnn.readNetFromCaffe(SSD_PROTO, SSD_MODEL_FILE)
    SSD_AVAILABLE = True


# ---------------------------
# 1. DEFINE FOOD-LIKE CLASSES
# ---------------------------

DEMO_ITEMS = {
    "burger": {"keywords": ["burger", "sandwich", "food"]},
    "fries": {"keywords": ["fries", "potato", "finger food"]},
    "cola": {"keywords": ["bottle", "cup", "drink"]},
}


# ---------------------------
# 2. YOLOv8 Detection Pipeline
# ---------------------------

def detect_yolo(img_path: str) -> List[str]:
    """
    Returns a list of detected food-like labels.
    Assumes model is fine-tuned on your food dataset.
    """
    model = YOLO("cv/models/food_yolo.pt")  # Replace with your actual path
    results = model(img_path)[0]

    labels = []
    for box in results.boxes:
        cls_id = int(box.cls)
        label = results.names.get(cls_id, "")
        labels.append(label.lower())

    return labels


# ---------------------------
# 3. MobileNet-SSD Detection
# ---------------------------

def detect_ssd(img_path: str) -> List[str]:
    """
    MobileNet SSD is not trained on food. 
    But it detects objects like bottle/cup → mapped to drinks.
    """
    image = cv2.imread(img_path)
    (h, w) = image.shape[:2]

    blob = cv2.dnn.blobFromImage(cv2.resize(image, (300, 300)),
                                 0.007843, (300, 300), 127.5)
    SSD_MODEL.setInput(blob)
    detections = SSD_MODEL.forward()

    labels = []

    for i in range(detections.shape[2]):
        confidence = detections[0, 0, i, 2]
        if confidence > 0.5:
            idx = int(detections[0, 0, i, 1])
            cls = SSD_CLASSES[idx].lower()

            # lightweight mapping
            if cls in ["bottle", "cup"]:
                labels.append("cola")
            if cls in ["person", "chair"]:
                continue  # ignore non-food

    return labels


# ---------------------------
# 4. Mock Detection (Always available)
# ---------------------------

def detect_mock(img_path: str, sample_hint: str = None) -> List[str]:
    """
    Always works. Returns detections based on hint.
    """
    if sample_hint == "fries_missing":
        return ["burger"]
    if sample_hint == "only_drink":
        return ["cola"]
    if sample_hint == "everything_ok":
        return ["burger", "fries", "cola"]

    # default demo result
    return ["burger", "fries"]


# ---------------------------
# 5. Unify detection pipeline
# ---------------------------

def detect_items(img_path: str, sample_hint: str = None) -> List[str]:
    """
    Unified detection entry.
    Priority:
        1) YOLOv8
        2) SSD (OpenCV)
        3) Mock fallback
    """
    if YOLO_AVAILABLE and os.path.exists("cv/models/food_yolo.pt"):
        try:
            return detect_yolo(img_path)
        except Exception:
            pass  # fallback to SSD

    if SSD_AVAILABLE:
        try:
            return detect_ssd(img_path)
        except Exception:
            pass  # fallback to mock

    return detect_mock(img_path, sample_hint)
