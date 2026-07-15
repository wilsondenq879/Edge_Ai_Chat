from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).parent
GAP = 28
LABEL_HEIGHT = 52
BACKGROUND = (18, 20, 24)
LABEL_COLOR = (240, 244, 250)


def fit_height(image, height):
    width = round(image.width * height / image.height)
    return image.resize((width, height), Image.Resampling.LANCZOS)


def add_label(draw, position, label):
    draw.text(position, label, fill=LABEL_COLOR)


before = Image.open(ROOT / "assistant-rendering-before.png").convert("RGB")
after = Image.open(ROOT / "assistant-rendering-after.jpeg").convert("RGB")

before_full = fit_height(before, 900)
after_full = fit_height(after, 900)
full = Image.new(
    "RGB",
    (before_full.width + after_full.width + GAP, 900 + LABEL_HEIGHT),
    BACKGROUND,
)
full.paste(before_full, (0, LABEL_HEIGHT))
full.paste(after_full, (before_full.width + GAP, LABEL_HEIGHT))
full_draw = ImageDraw.Draw(full)
add_label(full_draw, (12, 16), "Before: raw Markdown / no buttons")
add_label(
    full_draw,
    (before_full.width + GAP + 12, 16),
    "After: rendered table + clickable menu",
)
full.save(ROOT / "assistant-rendering-comparison-full.jpg", quality=92)

after_panel = after.crop((580, 80, 936, 710))
before_focused = fit_height(before, 1000)
after_focused = fit_height(after_panel, 1000)
focused = Image.new(
    "RGB",
    (before_focused.width + after_focused.width + GAP, 1000 + LABEL_HEIGHT),
    BACKGROUND,
)
focused.paste(before_focused, (0, LABEL_HEIGHT))
focused.paste(after_focused, (before_focused.width + GAP, LABEL_HEIGHT))
focused_draw = ImageDraw.Draw(focused)
add_label(focused_draw, (12, 16), "Failure state")
add_label(
    focused_draw,
    (before_focused.width + GAP + 12, 16),
    "Fixed message region",
)
focused.save(ROOT / "assistant-rendering-comparison-focused.jpg", quality=92)
