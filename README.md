# Verb Buster League

Verb Buster League is a responsive educational web app for practicing English irregular verbs. It was designed as a private parent-and-child learning project and is shared publicly as a non-commercial educational prototype.

## Highlights

- 21 progressively harder lessons with 168 irregular verbs
- Base, simple-past and past-participle examples
- 20-question Verb Battles with immediate feedback
- Sequential unlocking: score at least 17/20 to open the next lesson
- Personal Training that prioritizes previously practiced weak skills
- Monday-to-Sunday 1,000-point weekly mission and certificate collection
- Customizable player avatar and responsive interface
- 21 narrated training videos streamed from Dropbox
- Progress stored locally in the browser with `localStorage`

## Run locally

Serve the project because it loads JSON and ES modules:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/#home`.

## Parent Preview

Review all lessons without changing normal unlocking rules at:

```text
http://localhost:8000/?preview=1#training
```

## Video hosting

MP4 files are excluded from Git. Lessons use individual Dropbox links, which the player converts into streaming and download variants without storing credentials.

## Project structure

```text
assets/                  Character art, avatars and video posters
css/                     Responsive visual system
data/                    Verbs, certificates and video content
docs/video-scripts/      Scripts for all 21 training videos
js/                      App, battles, progress, scoring and certificates
scripts/                 Curriculum and video-generation utilities
index.html               Application entry point
```

## Content notice

This is a fan-made, non-commercial educational prototype. Some themes and character names reference third-party entertainment franchises. Those names and related trademarks belong to their respective owners. Generated placeholder illustrations are not official franchise artwork, and this project is not endorsed by or affiliated with those owners.

## Privacy

The app has no account system or analytics. Player profile, scores, mastery and certificates remain in the browser's local storage. Clearing browser data resets that progress.
