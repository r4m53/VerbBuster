import argparse
import importlib.util
import json
import os
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("vbl_video", ROOT / "scripts" / "build-pilot-video.py")
video = importlib.util.module_from_spec(spec)
spec.loader.exec_module(video)

VILLAIN_VOICES = [
    "en-US-ChristopherNeural",
    "en-US-GuyNeural",
    "en-US-AriaNeural",
    "en-US-JennyNeural",
]
LESSON_VOICES = [
    "en-US-JennyNeural",
    "en-US-GuyNeural",
    "en-US-AriaNeural",
    "en-US-AnaNeural",
]


def slug(value):
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def build_unit(unit, resume=False):
    number = int(unit["number"])
    build = ROOT / "videos" / f"build-lesson-{number:02d}"
    output = ROOT / "videos" / f"lesson-{number:02d}-{slug(unit['villain'])}.mp4"
    poster = ROOT / "assets" / "video-posters" / f"unit-{number:02d}.png"
    if build.exists() and not resume:
        shutil.rmtree(build)
    build.mkdir(parents=True, exist_ok=True)
    output.parent.mkdir(parents=True, exist_ok=True)
    poster.parent.mkdir(parents=True, exist_ok=True)
    villain_voice = VILLAIN_VOICES[(number - 1) % len(VILLAIN_VOICES)]
    scenes = [
        (video.villain_slide(unit, unit["openingChallenge"]), unit["openingChallenge"], villain_voice),
        (video.roster_slide(unit), "Today’s verbs are. " + ". ".join(f'{v["base"]}, {v["past"]}, {v["participle"]}' for v in unit["verbs"]) + ".", "en-US-AnaNeural"),
    ]
    for index, verb in enumerate(unit["verbs"], 1):
        narration = f'{verb["base"]}, {verb["past"]}, {verb["participle"]}. {verb["examples"]["base"]} {verb["examples"]["past"]} {verb["examples"]["participle"]}'
        scenes.append((video.verb_slide(verb, index), narration, LESSON_VOICES[(number + index - 2) % len(LESSON_VOICES)]))
    scenes.append((video.villain_slide(unit, unit["closingChallenge"], True), unit["closingChallenge"], villain_voice))
    segments = []
    for index, (image, narration, voice_name) in enumerate(scenes, 1):
        image_path = build / f"scene-{index:02}.png"
        audio_path = build / f"scene-{index:02}.wav"
        segment_path = build / f"scene-{index:02}.mp4"
        if resume and segment_path.exists() and segment_path.stat().st_size > 1000:
            segments.append(segment_path)
            print(f"Lesson {number:02d}: reused scene {index}/11", flush=True)
            continue
        image.save(image_path, optimize=True)
        video.speak(narration, audio_path, voice_name)
        video.encode_segment(image_path, audio_path, segment_path)
        segments.append(segment_path)
        print(f"Lesson {number:02d}: built scene {index}/11", flush=True)
    shutil.copyfile(build / "scene-01.png", poster)
    concat = build / "concat.txt"
    concat.write_text("".join(f"file '{path.as_posix()}'\n" for path in segments), encoding="utf8")
    assembled = build / "assembled.mp4"
    subprocess.run([video.FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", str(concat), "-c", "copy", str(assembled)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run([
        video.FFMPEG, "-y", "-i", str(assembled), "-i", str(build / "scene-01.png"),
        "-map", "0:v:0", "-map", "0:a:0", "-map", "1:v:0", "-c:v:0", "copy", "-c:a", "copy",
        "-c:v:1", "mjpeg", "-disposition:v:1", "attached_pic", str(output)
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Lesson {number:02d}: created {output.name}", flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=int, default=1)
    parser.add_argument("--end", type=int, default=21)
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()
    content = json.loads((ROOT / "data" / "video-content.json").read_text(encoding="utf8"))
    selected = [unit for unit in content["units"] if args.start <= int(unit["number"]) <= args.end]
    for unit in selected:
        build_unit(unit, args.resume)


if __name__ == "__main__":
    main()
