# Carpoolz

Carpoolz (with a Z) is a full-stack carpool cordination app originally built for USC's Ski and Snowboard team as a personal project. Each weekend, members can submit travel preferences, browse available cars, and request changes. Organizers can manage drivers, passengers, capacity, and requests, all in one place.

## Features

- Rider signup with departure and return availability
- Driver details, seat capacity, pickup locations, and gear preferences
- Rule-based carpool matching using time overlap, capacity, dates, and trip preferences
- Separate outbound and return car assignments
- Change-request workflow with pending, accepted, and denied states
- Organizer dashboard for managing people, cars, assignments, and announcements
- Live UI refreshes through Supabase Realtime
- Responsive interface for desktop and mobile

## Tech stack

- **Frontend:** React 19, JavaScript, JSX, CSS
- **Build tooling:** Vite 8
- **Backend:** Supabase
- **Database:** PostgreSQL through Supabase
- **Realtime:** Supabase Realtime subscriptions
- **Code quality:** ESLint 9 with React Hooks and React Refresh rules

## How it works

The React client stores application data in the following Supabase tables:

- `signups` — rider and driver details, availability, preferences, and assignments
- `carpools` — drivers, schedules, capacity, passengers, and pickup details
- `requests` — assignment-change requests and their status
- `settings` — organizer-controlled application settings

The matching logic filters out cars without overlapping availability or open seats, then scores eligible cars using trip date and Sunday skiing preferences. Organizers can review and adjust the resulting assignments in the admin dashboard.

The goal is to make a usually complicated responsibility a little easier, letting members and e-board communicate through a centralized app instead of disconnected text messages.  

## Local development

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm
- A Supabase project with the required tables and Row Level Security policies

### Setup

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment variable template:

   ```bash
   cp .env.example .env
   ```

3. Add your Supabase project URL and publishable/anonymous key to `.env`.

4. Start the development server:

   ```bash
   npm run dev
   ```

## Available scripts

```bash
npm run dev      # Start the Vite development server
npm run build    # Create a production build
npm run lint     # Run ESLint
npm run preview  # Preview the production build locally
```

## Security and privacy

Do not commit `.env` files, service-role keys, passwords, or real participant data. Supabase's browser key is designed to be public, so database access must be protected with appropriate Row Level Security policies. This repository intentionally excludes participant seed data and client-side passwords.

## Future improvements

- Add Supabase Auth and role-based access for organizer features
- Move matching and privileged organizer operations to server-side functions
- Add automated tests for matching and assignment rules
- Add database migrations and seed data for repeatable setup
- Add deployment instructions and a hosted demo

## License

This project is currently unlicensed. Add a license before accepting external contributions.
