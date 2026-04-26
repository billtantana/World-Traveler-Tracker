# World Traveler Tracker

Track countries visited by different travelers on an interactive world map.

The project ships with two app entry points:

1. `index-contained.js`: shared app data stays in server memory, and the selected traveler is stored per browser with `express-session`.
2. `index-postgres.js`: travelers and visited countries are stored in PostgreSQL.

## Features

- View all travelers
- Switch between travelers
- Add a new traveler with a color theme
- Mark countries as visited
- Clear a traveler's visited history
- Delete a traveler
- Interactive world map visualization

## Prerequisites

- Node.js 18 or newer
- PostgreSQL 14 or newer for the database-backed version

## Installation

1. Clone the repository and move into it.
   ```bash
   git clone <repository-url>
   cd World-Traveler-Tracker
   ```
2. Install dependencies.
   ```bash
   npm install
   ```
3. Create `.env` from `.env-example`.
   ```env
   DATABASE="YOUR_DATABASE_NAME"
   DB_USER="YOUR_DATABASE_USER"
   DB_PASSWORD="YOUR_DATABASE_PASSWORD"
   SV_SECRET="YOUR_SESSION_SECRET"
   ```

`SV_SECRET` is used by the contained app's session middleware. The PostgreSQL app uses the database variables.

## Running The Apps

### Contained Version

```bash
npm run dev-contained
```

This starts `http://localhost:3000` with:

- travelers and visited countries loaded from JSON files in `data/`
- mutable app data stored in server memory
- selected traveler stored in an Express session per browser

Refreshing the page keeps the selected traveler for that browser while the server is still running. Restarting the server resets the contained app back to the JSON seed data.

### PostgreSQL Version

```bash
npm run dev
```

This starts `http://localhost:3000` with PostgreSQL as the source of truth for travelers and visited countries.

## PostgreSQL Setup

Create a database whose name matches `DATABASE` in your `.env`, then run these statements:

```sql
CREATE TABLE countries (
  id SERIAL PRIMARY KEY,
  country_code VARCHAR(2) UNIQUE NOT NULL,
  country_name VARCHAR(100) NOT NULL
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  color VARCHAR(30) NOT NULL
);

CREATE TABLE visited_countries (
  id SERIAL PRIMARY KEY,
  country_code VARCHAR(2) NOT NULL REFERENCES countries(country_code),
  user_id INTEGER NOT NULL REFERENCES users(id)
);
```

### Data Files To Import

The PostgreSQL version now uses these CSV seed files from `data/`:

- `data/countries.csv`
- `data/users.csv`
- `data/visited_countries.csv`

Import them in this order so the foreign keys line up:

1. `countries.csv`
2. `users.csv`
3. `visited_countries.csv`

```sql
COPY countries(country_code, country_name)
FROM '/absolute/path/to/World-Traveler-Tracker/data/countries.csv'
DELIMITER ','
CSV HEADER;

COPY users(name, color)
FROM '/absolute/path/to/World-Traveler-Tracker/data/users.csv'
DELIMITER ','
CSV HEADER;

COPY visited_countries(country_code, user_id)
FROM '/absolute/path/to/World-Traveler-Tracker/data/visited_countries.csv'
DELIMITER ','
CSV HEADER;
```

The current CSV seed data includes these travelers and visits:

```text
users.csv
Billy olive
Steve pink
Tania pink
Alexis purple

visited_countries.csv
CL 1
CN 1
KR 2
AF 2
AL 3
DZ 3
AO 4
AR 4
```

## Project Structure

- `index-contained.js`: contained app entry point
- `index-postgres.js`: PostgreSQL app entry point
- `controller/`: app logic for each version
- `routes/`: Express routes for each version
- `views/`: EJS templates
- `public/`: static assets
- `data/`: CSV and JSON seed data for the two app versions
- `db/`: PostgreSQL connection utilities

## Tech Stack

- Node.js
- Express
- EJS
- express-session
- PostgreSQL
- pg
- dotenv
