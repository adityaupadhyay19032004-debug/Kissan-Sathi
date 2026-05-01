
import torch
import torchvision.transforms as transforms
from torchvision import datasets, models
from torch import nn, optim

data_dir = "PlantVillage"

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

dataset = datasets.ImageFolder(data_dir, transform=transform)
loader = torch.utils.data.DataLoader(dataset, batch_size=32, shuffle=True)

model = models.resnet18(pretrained=True)
model.fc = nn.Linear(model.fc.in_features, len(dataset.classes))

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

for epoch in range(5):
    for images, labels in loader:
        outputs = model(images)
        loss = criterion(outputs, labels)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

torch.save(model.state_dict(), "model.pth")
print("✅ Model trained")