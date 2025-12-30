# VibeMatch Gallery

AI-driven aesthetic gallery extension that analyzes your photos and generates new images matching your visual style.

![VibeMatch](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## Features

-   🖼️ **Multi-Gallery Support** - Organize your photos into separate galleries
-   🔍 **AI Vibe Analysis** - Automatically analyzes mood, colors, style of your images
-   ✨ **AI Image Generation** - Generate new images matching your gallery's aesthetic
-   🎨 **AI Image Editing** - Edit existing images with AI-powered transformations
-   💾 **Local Storage** - All images stored locally in IndexedDB
-   📥 **Download** - Download any image with one click

## Tech Stack

-   React + TypeScript
-   Vite
-   Tailwind CSS
-   Google Gemini AI (Flash 3 + Image Generation)
-   IndexedDB for local persistence

## Run Locally

**Prerequisites:** Node.js 18+

1. Clone the repository:

    ```bash
    git clone https://github.com/YOUR_USERNAME/vibematch-gallery.git
    cd vibematch-gallery
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Set up your API key:

    ```bash
    cp .env.example .env.local
    ```

    Then edit `.env.local` and add your [Gemini API key](https://aistudio.google.com/app/apikey)

4. Run the app:
    ```bash
    npm run dev
    ```

## Environment Variables

| Variable  | Description                |
| --------- | -------------------------- |
| `API_KEY` | Your Google Gemini API key |

## License

MIT
