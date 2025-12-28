**READ THISSSSSS**

This is my little photo-strip app. I'm writing this so you can run it on your laptop and poke around.

What you need
- Node.js (v18+)
- npm
- PHP (any recent version). If your PHP has the PDO SQLite driver enabled it'll use SQLite; if not it will store data in `data/store.json`.

Step-by-step — run and test

1) Install frontend packages

```bash
cd /home/youruser/Desktop/RafaBooth
npm install
```

2) Start the PHP backend (this serves the API endpoints)

```bash
# from the project root
php -S localhost:8002 -t .
```

3) Make sure the frontend knows where the API is. Open (or create) `.env.local` in the project root and put:

```dotenv
VITE_API_URL=http://localhost:8002/api.php
```

4) Start the dev server for the frontend

```bash
npm run dev
```

5) Open the address Vite shows in your browser (likely `http://localhost:3001`).

Test the app (exact steps)

- Click the `Sign In` button in the header.
- Choose `Login` and enter the credentials below.
- After login you should see your vault. Create a new strip, save it, and check the Vault screen. You can download or delete (burn) strips from there.

Login details (I set this up for you)
- Username: RAFA
- Password: Male@123

I removed placeholder/test accounts so these are the only credentials I left in the dev store.

Where data is stored
- If PHP has SQLite available, the app uses `data/spooky_booth.sqlite`.
- If not, the app uses `data/store.json` (this is a simple file-based fallback). I've reset `data/store.json` so there are no test users left.

API quick reference (dev server)
- Register: `POST /api.php?action=register` with JSON `{ "username","password" }`
- Login: `POST /api.php?action=login` with JSON `{ "username","password" }`
- Save photo: `POST /api.php?action=save_photo` with JSON `{ "user_id", "url", "timestamp" }`
- Get photos: `GET /api.php?action=get_photos&user_id=ID`
- Delete photo: `POST /api.php?action=delete_photo` with JSON `{ "user_id", "id" }`

Common problems and fixes
- If login/register fails: check that the PHP server you started in step (2) is still running and that `VITE_API_URL` points to the same host:port.
- If the console warns about `cdn.tailwindcss.com` — that's just saying the CDN is fine for dev but not ideal for production. Not urgent.
- If the browser shows a missing favicon, replace `favicon.svg` or drop a `favicon.ico` in the project root.

If anything breaks, tell me what you see and I’ll walk you through it.

— Rafa

**Important files and what they do (plain English)**

- `index.html` — The single web page the app runs in. It loads the fonts, styles, and the main JavaScript code. When you open the app in a browser this file is the one the browser reads first.
- `index.tsx` — The tiny launcher that tells the web page to run the React app. Think of it as the "start" button wired into the page.
- `App.tsx` — The main app logic and screens. This is where the buttons, camera, sign-in form, and navigation live.
- `components/` — A folder that groups smaller pieces the app uses (UI parts). Files like `Layout.tsx`, `Camera.tsx`, and `PhotoEditor.tsx` live here. Each file handles one part of the UI so the code stays organized.
- `services/` — Helper code that talks to other systems. `apiService.ts` is what the app uses to talk to the backend API. `soundService.ts` plays the little sound effects. `geminiService.ts` is where AI calls would go (placeholder).
- `api.php` — A simple server-side script that the app calls to register users, login, and save/load photos. You run this with PHP so the app has a place to store accounts and photo links.
- `database.php` — Server-side helper used by `api.php`. It manages where user and photo data is stored. It will use SQLite when available or a simple `data/store.json` file as a fallback.
- `data/store.json` — The file-based storage used when SQLite is not available. It holds the list of users and saved photo records. I reset this so there are no test accounts left.
- `.env.local` — Local settings for development (not for production). It tells the frontend where the backend API runs (the `VITE_API_URL` line). If you change the API port, update this file.
- `package.json` — Lists the tools and libraries the frontend needs and defines the commands you run like `npm run dev`.
- `vite.config.ts` and `tsconfig.json` — Small setup files for the build tool (Vite) and TypeScript. You can ignore them for day-to-day use; they keep the project running smoothly.
- `favicon.svg` — Small icon shown in the browser tab. Replacing this or adding a `favicon.ico` is fine if you prefer a different icon.
- `README.md` — What you're reading now. I updated it so you dummies understand it.

**What this long path means**

When you see `/home/roon/Desktop/RafaBooth` broken down:
- `/home` — The folder on the computer where personal user folders live and this will be yours when you downoad this projet.
- `/home/user` — The account (user) named `user` on this machine.
- `/home/user/Desktop` — The `Desktop` folder for that user. Files here usually appear on the user's desktop screen.
- `/home/user/Desktop/RafaBooth` — The project folder. All the files I just described live inside this folder.

If you move the project to another computer or another folder nothing in the app requires this exact path — it only matters where you store the project on your machine. When I write commands in the guide I used the project root path so it's clear where to run them from.  for windows the path will be C:\Users\username\Desktop or whatever etc etc blah blah

If you want me to simplify any of the explanations above further or add screenshots, tell me which file explanations you'd like shorter or pasted into a printable note for your friend.


