# MemeMic

**Life gave you a story. Give it a punchline.**

MemeMic turns everyday stories into original comedy scripts and expressive audio performances. Choose a fictionalized narrator, set the language and humor level, edit the generated script, then listen, download, or share it.

## Features

- Record a story or write it yourself; review and edit the transcript before continuing.
- Generate original scripts with Groq in Hindi, Hinglish, or English, with gentle, balanced, or extra-punchy humor.
- Edit and remix scripts before turning them into MP3 speech with Fish Audio.
- Select from six fictionalized comedy personas, each with its own supplied portrait and writing/delivery guide.
- Assign an authorized Fish Audio voice model to Somay with `FISH_AUDIO_REFERENCE_ID_SOMAY_RAINA`; other characters can use the optional shared `FISH_AUDIO_REFERENCE_ID`.
- Follow playback with timed captions, download audio, copy text, or create a shareable script link.
- Save up to 25 scripts in the current browser, export them as JSON, or delete them. Audio files are not saved in the library.
- Meet the creators on the About page.
- API request-size limits, best-effort per-process rate limits, and a basic health endpoint at `/api/health`.

## Tech stack

- Next.js 16 App Router and React 19
- TypeScript and Tailwind CSS
- Groq API for script generation and Whisper transcription
- Fish Audio API for MP3 voice generation
- Vitest and ESLint

## Getting started

### Requirements

- Node.js 20.9 or newer
- npm
- A Groq API key for script generation and audio transcription
- A Fish Audio API key for voice generation

### Install and run

```bash
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

On macOS or Linux, copy the environment template with:

```bash
cp .env.example .env.local
```

Add the provider credentials to `.env.local`:

```dotenv
GROQ_API_KEY=your_groq_api_key
FISH_AUDIO_API_KEY=your_fish_audio_api_key
```

Never commit `.env.local`, expose provider keys through `NEXT_PUBLIC_` variables, or paste secrets into issues or chat.

### Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `GROQ_API_KEY` | Yes for scripts/transcription | — | Server-side Groq API credential |
| `GROQ_MODEL` | No | `openai/gpt-oss-120b` | Groq chat model for original scripts |
| `GROQ_TRANSCRIPTION_MODEL` | No | `whisper-large-v3-turbo` | Groq model for uploaded recordings |
| `FISH_AUDIO_API_KEY` | Yes for speech | — | Server-side Fish Audio API credential |
| `FISH_AUDIO_MODEL` | No | `s2.1-pro-free` | Fish Audio speech model |
| `FISH_AUDIO_REFERENCE_ID` | No | — | Optional shared voice model ID for characters without a dedicated ID |
| `FISH_AUDIO_REFERENCE_ID_SOMAY_RAINA` | No | — | Optional authorized voice model ID for Somay Raina |
| `NEXT_PUBLIC_APP_NAME` | No | `MemeMic` | Reserved public app label |

In Vercel, add provider keys and voice IDs under **Project Settings → Environment Variables** for the desired environments, then redeploy. Keep credentials server-only.

## Available commands

```bash
npm run dev      # Start the development server
npm run lint     # Run ESLint
npm test         # Run Vitest
npm run build    # Create a production build
npm run start    # Serve the production build locally
```

## API overview

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/generate-script` | `POST` | Validate story and generate a script with Groq |
| `/api/generate-voice` | `POST` | Generate an MP3 with Fish Audio |
| `/api/transcribe` | `POST` | Transcribe an uploaded audio recording with Groq |
| `/api/health` | `GET` | Return a minimal `{ "status": "ok" }` uptime probe |

The health endpoint checks that the app is responding; it does not test provider credentials or third-party availability.

## Privacy and production notes

- Stories and recordings are sent to Groq for generation/transcription; scripts sent for speech are sent to Fish Audio. Do not submit passwords, financial details, or other sensitive information.
- Saved scripts and drafts are stored only in the current browser. They are not synced between devices, and clearing browser storage removes them.
- Share links encode the script and character in the URL fragment. Anyone with a link can read that script; generated audio is not included.
- API rate limits are in-memory and per server process. They are best-effort and do not coordinate between Vercel serverless instances. Use a shared durable rate-limit store and enforce provider usage limits before scaling public traffic.
- Accounts, cloud-synced projects, persistent audio storage, and hosted public performance pages are not included.
- Only configure Fish Audio voice models you have permission to use. The app's characters are fictionalized personas; generated voices are not presented as the real comedians' voices or endorsements.

## Creators

- [Tavishi Jain](https://www.linkedin.com/in/tavishi-jain-11895538a)
- [Atiksh Sharma](https://www.linkedin.com/in/atiksh-sharma-49b71437a)

See the [About page](https://mememic.vercel.app/about) for creator photos and project details.