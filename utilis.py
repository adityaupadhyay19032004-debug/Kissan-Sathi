from PIL import Image
import torch
import torchvision.transforms as transforms

def load_model():
    model = torch.hub.load('pytorch/vision', 'resnet18', pretrained=True)
    model.eval()
    return model

def preprocess_image(image):
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor()
    ])
    return transform(image).unsqueeze(0)

def predict_disease(model, image):
    img = preprocess_image(image)

    with torch.no_grad():
        output = model(img)
        pred = torch.argmax(output, 1).item()

    classes = ["Healthy", "Leaf Blight", "Rust"]

    remedies = {
        "Healthy": "No issue 🌱",
        "Leaf Blight": "Use fungicide 💊",
        "Rust": "Apply sulfur 🌿"
    }

    disease = classes[pred % 3]

    return {
        "disease": disease,
        "remedy": remedies[disease]
    }