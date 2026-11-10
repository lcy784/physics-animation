"""Build a self-contained physics lesson; Python standard library only."""
import argparse
import html
import json
import re
from pathlib import Path
from validate_lesson import validate


def inline_script(text):
    return re.sub(r"</script", r"<\\/script", text, flags=re.IGNORECASE)


def build(lesson_path, model_path, scene_path, output):
    assets = Path(__file__).resolve().parents[1] / "assets"
    lesson = json.loads(Path(lesson_path).read_text(encoding="utf-8"))
    validate(lesson)
    vendor = assets / "vendor"
    license_text = (vendor / "LICENSE.three.txt").read_text(encoding="utf-8")
    scripts = [
        (vendor / "three-controls.min.js").read_text(encoding="utf-8"),
        "globalThis.LESSON=" + json.dumps(lesson, ensure_ascii=False) + ";",
        Path(model_path).read_text(encoding="utf-8"),
        (assets / "scene-kit.js").read_text(encoding="utf-8"),
        Path(scene_path).read_text(encoding="utf-8"),
        (assets / "vector-controls.js").read_text(encoding="utf-8"),
        (assets / "label-controls.js").read_text(encoding="utf-8"),
        (assets / "runtime.js").read_text(encoding="utf-8"),
        (assets / "workspace.js").read_text(encoding="utf-8"),
        (assets / "annotations.js").read_text(encoding="utf-8"),
    ]
    replacements = {
        "TITLE": html.escape(lesson["title"]),
        "STYLE": (assets / "style.css").read_text(encoding="utf-8") + "\n" + (assets / "workspace.css").read_text(encoding="utf-8"),
        "LICENSE": license_text.replace("--", "- -"),
        "SCRIPTS": "\n".join("<script>\n" + inline_script(s) + "\n</script>" for s in scripts),
    }
    template = (assets / "template.html").read_text(encoding="utf-8")
    result = re.sub(r"@@(TITLE|STYLE|LICENSE|SCRIPTS)@@", lambda m: replacements[m[1]], template)
    target = Path(output).resolve()
    if target in {Path(p).resolve() for p in (lesson_path, model_path, scene_path)}:
        raise ValueError("Output must not overwrite an input")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(result, encoding="utf-8")
    print(f"Built {target} ({target.stat().st_size:,} bytes)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("lesson", "model", "scene", "output"):
        parser.add_argument("--" + name, required=True)
    args = parser.parse_args()
    build(args.lesson, args.model, args.scene, args.output)
