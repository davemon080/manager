# Manager App

Standalone admin app for reading and writing onboarding submissions.

## Features
- Read submissions (latest first)
- Create new submission
- Edit existing submission
- Delete submission
- Separate config via .env

## Setup
1. Open terminal in manager folder.
2. Run: npm install
3. Copy env file: copy .env.example .env
4. Add your DATABASE_URL in .env
5. Run schema.sql once on your database if needed
6. Start: npm run dev

Open: http://localhost:5050
