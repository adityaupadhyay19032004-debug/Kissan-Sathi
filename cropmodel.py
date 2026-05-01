"""
KisaanSaathi — Crop Disease Detection Service
Model  : wambugu71/crop_leaf_diseases_vit  (ViT, 98% accuracy)
Crops  : Corn, Potato, Rice, Wheat
Port   : 5001
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image, UnidentifiedImageError
from transformers import ViTFeatureExtractor, ViTForImageClassification
import torch
import io
import traceback

app = Flask(__name__)
CORS(app)

# ── Load model once at startup ────────────────────────────────────────────────
MODEL_ID = "wambugu71/crop_leaf_diseases_vit"
print(f"⏳ Loading model: {MODEL_ID} ...")

feature_extractor = ViTFeatureExtractor.from_pretrained(MODEL_ID)
model = ViTForImageClassification.from_pretrained(
    MODEL_ID,
    ignore_mismatched_sizes=True
)
model.eval()
print("✅ Model loaded successfully!")

# ── Disease → remedy mapping ──────────────────────────────────────────────────
REMEDIES = {
    # Corn
    "Corn Common Rust":      "Apply fungicide (Mancozeb/Propiconazole). Remove infected leaves. Ensure proper spacing.",
    "Corn Gray Leaf Spot":   "Use resistant varieties. Apply Azoxystrobin fungicide. Avoid overhead irrigation.",
    "Corn Leaf Blight":      "Apply copper-based fungicide. Remove crop debris after harvest. Rotate crops.",
    "Corn Healthy":          "Crop is healthy! Maintain regular watering and fertilization schedule.",
    # Potato
    "Potato Early Blight":   "Apply Mancozeb or Chlorothalonil fungicide. Remove infected leaves. Avoid wetting foliage.",
    "Potato Late Blight":    "Apply Metalaxyl fungicide immediately. Destroy infected plants. Avoid waterlogging.",
    "Potato Healthy":        "Crop is healthy! Monitor weekly and maintain soil moisture.",
    # Rice
    "Rice Brown Spot":       "Apply Tricyclazole or Carbendazim. Ensure balanced NPK fertilization.",
    "Rice Leaf Blast":       "Apply Tricyclazole fungicide. Avoid excess nitrogen. Drain fields periodically.",
    "Rice Hispa":            "Remove and destroy affected tillers. Apply Chlorpyrifos insecticide.",
    "Rice Healthy":          "Crop is healthy! Maintain water level and monitor for pests.",
    # Wheat
    "Wheat Brown Rust":      "Apply Propiconazole or Tebuconazole fungicide. Use resistant varieties.",
    "Wheat Yellow Rust":     "Apply Propiconazole fungicide early. Remove infected plants. Use certified seeds.",
    "Wheat Healthy":         "Crop is healthy! Continue regular irrigation and fertilization.",
    # Fallback
    "Invalid":               "Image unclear or not a crop leaf. Please upload a clear leaf photo in good lighting.",
}

def get_remedy(label):
    """Match label to remedy, case-insensitive partial match."""
    for key, remedy in REMEDIES.items():
        if key.lower() in label.lower() or label.lower() in key.lower():
            return remedy
    return "Consult your local agricultural extension officer for advice."

def get_status(label):
    """Return healthy / diseased / invalid based on label."""
    label_lower = label.lower()
    if "invalid" in label_lower:
        return "invalid"
    if "healthy" in label_lower:
        return "healthy"
    return "diseased"

# ── /predict endpoint ─────────────────────────────────────────────────────────
@app.route("/predict", methods=["POST"])
def predict():
    try:
        # Accept both multipart file and raw bytes
        if "image" in request.files:
            file_bytes = request.files["image"].read()
        elif request.data:
            file_bytes = request.data
        else:
            return jsonify({"success": False, "message": "No image provided."}), 400

        # Open and validate image
        try:
            image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        except UnidentifiedImageError:
            return jsonify({"success": False, "message": "Invalid image file."}), 400

        # Run inference
        inputs  = feature_extractor(images=image, return_tensors="pt")
        with torch.no_grad():
            outputs = model(**inputs)
            logits  = outputs.logits
            probs   = torch.softmax(logits, dim=1)[0]
            idx     = probs.argmax().item()
            confidence = round(float(probs[idx]) * 100, 1)

        label   = model.config.id2label[idx]
        remedy  = get_remedy(label)
        status  = get_status(label)

        return jsonify({
            "success":    True,
            "disease":    label,
            "remedy":     remedy,
            "status":     status,
            "confidence": confidence,
            "solution":   remedy,   # alias for backend compatibility
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": f"Prediction error: {str(e)}"}), 500

# ── /health endpoint ──────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": MODEL_ID})

# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("🚀 AI Service running on http://localhost:5001")
    app.run(host="0.0.0.0", port=5001, debug=False)
