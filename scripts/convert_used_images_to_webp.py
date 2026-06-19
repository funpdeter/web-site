from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"

IMAGE_PATHS = [
    "FUNDETER/FUNDETER/VARIACIONES/1.png",
    "front1.png",
    "front2.png",
    "Aliado 1 con fondo.jpeg",
    "Aliado 2 con fondo.jpg",
    "ALUNA IA 2.png",
    "foto 3.jpeg",
    "capac2_gideam.png",
    "resultados_1.jpeg",
    "resultados_2.jpeg",
    "Investigaciones2.png",
    "Aluna_IA.jpg",
    "CEO.png",
    "favicon-512.png",
]

QUALITY_OVERRIDES = {
    "foto 3.jpeg": 76,
}


def output_path(path: Path) -> Path:
    return path.with_suffix(".webp")


def has_real_alpha(image: Image.Image) -> bool:
    if image.mode in ("RGBA", "LA"):
        alpha = image.getchannel("A")
        return alpha.getextrema()[0] < 255
    return image.mode == "P" and "transparency" in image.info


def convert(path: Path) -> tuple[str, int, int, int, int]:
    target = output_path(path)
    with Image.open(path) as image:
        if has_real_alpha(image):
            converted = image.convert("RGBA")
            converted.save(target, "WEBP", lossless=True, method=6)
        else:
            converted = image.convert("RGB")
            quality = QUALITY_OVERRIDES.get(str(path.relative_to(PUBLIC)), 84)
            converted.save(target, "WEBP", quality=quality, method=6)

    return (
        str(target.relative_to(ROOT)),
        path.stat().st_size,
        target.stat().st_size,
        image.width,
        image.height,
    )


def main() -> None:
    rows = []
    for relative in IMAGE_PATHS:
        source = PUBLIC / relative
        if not source.exists():
            raise FileNotFoundError(source)
        rows.append(convert(source))

    for target, source_size, target_size, width, height in rows:
        saved = source_size - target_size
        ratio = (saved / source_size * 100) if source_size else 0
        print(f"{target}\t{width}x{height}\t{source_size}->{target_size}\t{ratio:.1f}%")


if __name__ == "__main__":
    main()
