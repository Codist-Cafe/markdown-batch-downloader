#!/usr/bin/env python3
"""Generate extension icons in multiple sizes."""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    """Create an icon of the specified size."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Scale factor
    s = size / 128

    # Background circle
    margin = int(4 * s)
    draw.ellipse([margin, margin, size - margin, size - margin],
                 fill='#4a5568')

    # Document shape (light rectangle)
    doc_left = int(32 * s)
    doc_top = int(20 * s)
    doc_width = int(48 * s)
    doc_height = int(56 * s)
    doc_radius = int(4 * s)
    draw.rounded_rectangle([doc_left, doc_top, doc_left + doc_width, doc_top + doc_height],
                           radius=doc_radius, fill='#e2e8f0')

    # Draw "M" on document
    try:
        font_size = int(28 * s)
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()

    text = "M"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = doc_left + (doc_width - text_width) // 2
    text_y = doc_top + int(10 * s)
    draw.text((text_x, text_y), text, fill='#4a5568', font=font)

    # Download arrow (green)
    arrow_top = int(70 * s)
    arrow_middle = int(88 * s)
    arrow_bottom = int(108 * s)
    arrow_center = int(64 * s)
    arrow_width = int(28 * s)
    arrow_stem_width = int(16 * s)
    arrow_stem_height = int(20 * s)

    # Arrow stem (rectangle at top)
    stem_left = arrow_center - arrow_stem_width // 2
    stem_right = arrow_center + arrow_stem_width // 2
    draw.rectangle([stem_left, arrow_top, stem_right, arrow_top + arrow_stem_height],
                   fill='#48bb78')

    # Arrow head (triangle)
    arrow_points = [
        (arrow_center - arrow_width, arrow_middle),  # top left
        (arrow_center + arrow_width, arrow_middle),  # top right
        (arrow_center, arrow_bottom)                  # bottom center
    ]
    draw.polygon(arrow_points, fill='#48bb78')

    return img

def main():
    sizes = [16, 48, 128]
    script_dir = os.path.dirname(os.path.abspath(__file__))

    for size in sizes:
        icon = create_icon(size)
        filepath = os.path.join(script_dir, f'icon-{size}.png')
        icon.save(filepath, 'PNG')
        print(f'Created {filepath}')

if __name__ == '__main__':
    main()
