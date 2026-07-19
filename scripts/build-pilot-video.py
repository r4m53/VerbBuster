import json
import os
import re
import shutil
import subprocess
import wave
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "videos" / "build-lesson-01"
OUTPUT = ROOT / "videos" / "lesson-01-night-ninja.mp4"
WIDTH, HEIGHT = 1280, 720
BLUE = "#087bc1"
BLUE_LIGHT = "#49a8e8"
BLUE_DARK = "#075b91"
NAVY = "#172033"
CREAM = "#f6f2e8"
WHITE = "#fffdf8"
LIME = "#d9f43b"
CORAL = "#ff654d"
FORM_COLORS = {"base": BLUE_LIGHT, "past": CORAL, "participle": LIME}
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def font(size, display=False):
    choices = [
        Path("C:/Windows/Fonts/impact.ttf") if display else Path("C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/arialbd.ttf"),
    ]
    return ImageFont.truetype(str(next(path for path in choices if path.exists())), size)


def rounded_panel(draw, box, fill=WHITE, outline=NAVY, radius=28, width=5):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def base_slide(kicker, title, dark=False, outline=NAVY):
    image = Image.new("RGB", (WIDTH, HEIGHT), BLUE_DARK if dark else CREAM)
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((45, 38, 1235, 682), radius=34, fill=BLUE if dark else WHITE, outline=outline, width=6)
    if kicker:
        draw.rounded_rectangle((78, 68, 410, 112), radius=22, fill=LIME)
        draw.text((244, 90), kicker.upper(), font=font(20, True), fill=NAVY, anchor="mm")
    draw.text((82, 138), title.upper(), font=font(60, True), fill=WHITE if dark else NAVY)
    return image, draw


def fit_text(draw, text, box, max_size=46, min_size=24, display=False, fill=NAVY, spacing=10, anchor="mm"):
    x1, y1, x2, y2 = box
    for size in range(max_size, min_size - 1, -2):
        selected = font(size, display)
        words, lines, current = text.split(), [], ""
        for word in words:
            test = f"{current} {word}".strip()
            if draw.textbbox((0, 0), test, font=selected)[2] <= x2 - x1:
                current = test
            else:
                lines.append(current)
                current = word
        if current:
            lines.append(current)
        line_height = size + spacing
        if len(lines) * line_height <= y2 - y1:
            start_y = (y1 + y2 - len(lines) * line_height) / 2 + line_height / 2
            for index, line in enumerate(lines):
                draw.text(((x1 + x2) / 2, start_y + index * line_height), line, font=selected, fill=fill, anchor=anchor)
            return


def add_villain(image, path, box=(790, 165, 1170, 545)):
    villain = Image.open(path).convert("RGBA")
    villain.thumbnail((box[2] - box[0], box[3] - box[1]), Image.Resampling.LANCZOS)
    x = box[0] + (box[2] - box[0] - villain.width) // 2
    y = box[1] + (box[3] - box[1] - villain.height) // 2
    image.paste(villain, (x, y), villain)


def highlighted_sentence(draw, sentence, target, y, color):
    regular, bold = font(31), font(33)
    match = re.search(rf"\b{re.escape(target)}\b", sentence, flags=re.IGNORECASE)
    if not match:
        draw.text((640, y), sentence, font=regular, fill=NAVY, anchor="mm")
        return
    parts = [sentence[:match.start()], sentence[match.start():match.end()], sentence[match.end():]]
    widths = [draw.textlength(parts[0], font=regular), draw.textlength(parts[1], font=bold), draw.textlength(parts[2], font=regular)]
    x = (WIDTH - sum(widths)) / 2
    draw.text((x, y), parts[0], font=regular, fill=NAVY, anchor="lm")
    x += widths[0]
    draw.text((x, y), parts[1], font=bold, fill=color, anchor="lm", stroke_width=1, stroke_fill=NAVY)
    x += widths[1]
    draw.text((x, y), parts[2], font=regular, fill=NAVY, anchor="lm")


def villain_slide(unit, line, closing=False):
    image, draw = base_slide("Final challenge" if closing else "", unit["villain"], True)
    if not closing:
        draw.rounded_rectangle((965, 68, 1202, 112), radius=22, fill=LIME)
        draw.text((1083, 90), f"LESSON {unit['number']:02}", font=font(20, True), fill=NAVY, anchor="mm")
    add_villain(image, ROOT / unit["villainImage"])
    rounded_panel(draw, (85, 220, 760, 570), fill=WHITE)
    fit_text(draw, f'“{line}”', (125, 250, 720, 535), max_size=38, min_size=25)
    draw.text((980, 585), unit["villain"].upper(), font=font(28, True), fill=LIME, anchor="mm")
    return image


def roster_slide(unit):
    image, draw = base_slide("Today’s roster", "Eight verb moves")
    for index, verb in enumerate(unit["verbs"]):
        col, row = index % 2, index // 2
        x, y = 85 + col * 585, 225 + row * 92
        rounded_panel(draw, (x, y, x + 535, y + 68), fill=CREAM, radius=18, width=3)
        draw.text((x + 24, y + 34), f"{verb['base'].upper()}  ·  {verb['past'].upper()}  ·  {verb['participle'].upper()}", font=font(27, True), fill=NAVY, anchor="lm")
    return image


def verb_slide(verb, index):
    image, draw = base_slide(f"Verb {index} of 8", verb["base"], outline=BLUE)
    forms = [("base", verb["base"]), ("past", verb["past"]), ("participle", verb["participle"])]
    for col, (skill, value) in enumerate(forms):
        x1 = 85 + col * 385
        draw.rounded_rectangle((x1, 215, x1 + 340, 305), radius=22, fill=FORM_COLORS[skill], outline=NAVY, width=4)
        draw.text((x1 + 170, 260), value.upper(), font=font(39, True), fill=NAVY, anchor="mm")
        draw.text((x1 + 170, 330), skill.upper(), font=font(18, True), fill=NAVY, anchor="mm")
    highlighted_sentence(draw, verb["examples"]["base"], verb["base"], 420, BLUE)
    highlighted_sentence(draw, verb["examples"]["past"], verb["past"], 495, CORAL)
    highlighted_sentence(draw, verb["examples"]["participle"], verb["participle"], 570, "#789300")
    return image


def speak(text, path, voice):
    mp3_path = path.with_suffix(".mp3")
    for attempt in range(3):
        try:
            result = subprocess.run([
                "python", "-m", "edge_tts", "--voice", voice, "--rate=-5%", "--text", text, "--write-media", str(mp3_path)
            ], stdout=subprocess.DEVNULL, timeout=45)
        except subprocess.TimeoutExpired:
            result = subprocess.CompletedProcess([], 1)
        if result.returncode == 0 and mp3_path.exists() and mp3_path.stat().st_size > 1000:
            break
        if attempt == 2:
            raise RuntimeError(f"Voice {voice} did not return audio after three attempts")
    subprocess.run([
        FFMPEG, "-y", "-i", str(mp3_path), "-ar", "24000", "-ac", "1", str(path)
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def wav_duration(path):
    with wave.open(str(path), "rb") as audio:
        return audio.getnframes() / audio.getframerate()


def encode_segment(image_path, audio_path, output_path):
    duration = wav_duration(audio_path) + 0.65
    subprocess.run([
        FFMPEG, "-y", "-loop", "1", "-framerate", "30", "-i", str(image_path), "-i", str(audio_path),
        "-vf", "fade=t=in:st=0:d=0.35,fade=t=out:st={:.2f}:d=0.35,format=yuv420p".format(max(0, duration - 0.35)),
        "-t", f"{duration:.3f}", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "aac", "-b:a", "160k", "-shortest", str(output_path)
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    resume = os.getenv("VBL_RESUME") == "1"
    if BUILD.exists() and not resume:
        shutil.rmtree(BUILD)
    BUILD.mkdir(parents=True, exist_ok=True)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    content = json.loads((ROOT / "data" / "video-content.json").read_text(encoding="utf8"))
    unit = content["units"][0]
    scenes = [
        (villain_slide(unit, unit["openingChallenge"]), unit["openingChallenge"], "en-US-ChristopherNeural"),
        (roster_slide(unit), "Today’s verbs are. " + ". ".join(f'{v["base"]}, {v["past"]}, {v["participle"]}' for v in unit["verbs"]) + ".", "en-US-AnaNeural"),
    ]
    lesson_voices = ["en-US-JennyNeural", "en-US-GuyNeural", "en-US-AriaNeural", "en-US-AnaNeural"]
    for index, verb in enumerate(unit["verbs"], 1):
        narration = f'{verb["base"]}, {verb["past"]}, {verb["participle"]}. {verb["examples"]["base"]} {verb["examples"]["past"]} {verb["examples"]["participle"]}'
        scenes.append((verb_slide(verb, index), narration, lesson_voices[(index - 1) % len(lesson_voices)]))
    scenes.append((villain_slide(unit, unit["closingChallenge"], True), unit["closingChallenge"], "en-US-ChristopherNeural"))
    segments = []
    for index, (image, narration, voice) in enumerate(scenes, 1):
        image_path = BUILD / f"scene-{index:02}.png"
        audio_path = BUILD / f"scene-{index:02}.wav"
        segment_path = BUILD / f"scene-{index:02}.mp4"
        if resume and segment_path.exists() and segment_path.stat().st_size > 1000:
            segments.append(segment_path)
            print(f"Reused scene {index}/{len(scenes)}", flush=True)
            continue
        image.save(image_path, optimize=True)
        speak(narration, audio_path, voice)
        encode_segment(image_path, audio_path, segment_path)
        segments.append(segment_path)
        print(f"Built scene {index}/{len(scenes)}", flush=True)
    concat = BUILD / "concat.txt"
    concat.write_text("".join(f"file '{path.as_posix()}'\n" for path in segments), encoding="utf8")
    assembled = BUILD / "assembled.mp4"
    subprocess.run([FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", str(concat), "-c", "copy", str(assembled)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run([
        FFMPEG, "-y", "-i", str(assembled), "-i", str(BUILD / "scene-01.png"),
        "-map", "0:v:0", "-map", "0:a:0", "-map", "1:v:0",
        "-c:v:0", "copy", "-c:a", "copy", "-c:v:1", "mjpeg", "-disposition:v:1", "attached_pic", str(OUTPUT)
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Created {OUTPUT}")


if __name__ == "__main__":
    main()
