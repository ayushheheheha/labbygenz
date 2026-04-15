# LabbyGenz

Full-stack learning platform with:
- Laravel 11 API backend (`lab-server`)
- React + Vite frontend (`lab-client`)

## Monorepo Structure

- `lab-server` - Laravel API, auth, courses, quizzes, attempts, IDE APIs
- `lab-client` - Student/admin UI built with React and Tailwind

## Tech Stack

- Backend: Laravel 11, Sanctum, Socialite, Spatie Permission, MySQL
- Frontend: React, Vite, Tailwind CSS, Axios, React Router

## Prerequisites

- PHP 8.2+
- Composer
- MySQL
- Node.js 18+
- npm

## Setup

### 1) Backend (`lab-server`)

```bash
cd lab-server
composer install
cp .env.example .env
php artisan key:generate
```

Update database settings in `lab-server/.env`, then run:

```bash
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

Backend runs by default on `http://localhost:8000`.

### 2) Frontend (`lab-client`)

```bash
cd lab-client
npm install
```

Create/update `lab-client/.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

Run frontend:

```bash
npm run dev
```

Frontend runs by default on `http://localhost:5173`.

## Production Build

```bash
cd lab-client
npm run build
```

## Notes

- Do not commit `.env` files or local secrets.
- This repository uses a root `.gitignore` for both apps.
- If using OAuth, configure Google credentials in backend `.env`.
