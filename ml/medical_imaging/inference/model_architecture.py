"""
U-Net architecture - EXACTLY matches best_model.pth
Reverse-engineered from state_dict layer names and shapes.
"""
import torch
import torch.nn as nn


class DoubleConv(nn.Module):
    """
    Two conv layers with BatchNorm + ReLU.
    Structure matches state_dict keys:
      block.0 = Conv2d(bias=False)
      block.1 = BatchNorm2d
      block.2 = ReLU
      block.3 = Conv2d(bias=False)
      block.4 = BatchNorm2d
      block.5 = ReLU
    """
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
        )

    def forward(self, x):
        return self.block(x)


class DownBlock(nn.Module):
    """
    MaxPool + DoubleConv.
    State dict keys:
      block.0 = MaxPool2d (no params)
      block.1.block.N = DoubleConv layers
    """
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.block = nn.Sequential(
            nn.MaxPool2d(2),
            DoubleConv(in_channels, out_channels),
        )

    def forward(self, x):
        return self.block(x)


class UpBlock(nn.Module):
    """
    ConvTranspose + Skip concat + DoubleConv.
    State dict keys:
      up.weight, up.bias
      conv.block.N
    """
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.up = nn.ConvTranspose2d(
            in_channels, out_channels, kernel_size=2, stride=2
        )
        # After concat: out_channels (from up) + out_channels (from skip) = in_channels
        # So DoubleConv input = in_channels, output = out_channels
        self.conv = DoubleConv(in_channels, out_channels)

    def forward(self, x, skip):
        x = self.up(x)
        x = torch.cat([skip, x], dim=1)
        return self.conv(x)


class OutConv(nn.Module):
    """
    Final 1x1 conv.
    State dict keys: conv.weight, conv.bias
    """
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size=1)

    def forward(self, x):
        return self.conv(x)


class UNet(nn.Module):
    """
    U-Net for lumbar spine MRI segmentation.
    Input:  (B, 1, H, W) grayscale MRI
    Output: (B, 6, H, W) per-class logits
    """
    def __init__(self, in_channels=1, num_classes=6):
        super().__init__()

        # Encoder
        self.inc = DoubleConv(in_channels, 32)    # 32 ch
        self.down1 = DownBlock(32, 64)             # 64 ch
        self.down2 = DownBlock(64, 128)            # 128 ch
        self.down3 = DownBlock(128, 256)           # 256 ch
        self.down4 = DownBlock(256, 512)           # 512 ch (bottleneck)

        # Decoder
        self.up1 = UpBlock(512, 256)               # 512→256
        self.up2 = UpBlock(256, 128)               # 256→128
        self.up3 = UpBlock(128, 64)                # 128→64
        self.up4 = UpBlock(64, 32)                 # 64→32

        # Output
        self.outc = OutConv(32, num_classes)

    def forward(self, x):
        x1 = self.inc(x)          # (B, 32,  H,    W)
        x2 = self.down1(x1)       # (B, 64,  H/2,  W/2)
        x3 = self.down2(x2)       # (B, 128, H/4,  W/4)
        x4 = self.down3(x3)       # (B, 256, H/8,  W/8)
        x5 = self.down4(x4)       # (B, 512, H/16, W/16)

        x = self.up1(x5, x4)      # (B, 256, H/8,  W/8)
        x = self.up2(x, x3)       # (B, 128, H/4,  W/4)
        x = self.up3(x, x2)       # (B, 64,  H/2,  W/2)
        x = self.up4(x, x1)       # (B, 32,  H,    W)

        return self.outc(x)       # (B, 6,   H,    W)