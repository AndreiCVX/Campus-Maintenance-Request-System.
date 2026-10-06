# Campus Maintenance Request System

A web app where students, faculty and staff report campus maintenance problems, and the facilities office assigns, tracks and closes them. Built for the Midterm Project (Campus System, Round 1) using Node.js and Express.

## Project Description

Maintenance problems on campus are usually reported by word of mouth or paper notes, so nobody knows what is broken, who is fixing it, or how long it has been waiting. This system replaces that with one shared record. A requester files a report, an admin assigns it to a technician, and the technician updates the status until it is done. Every status change is logged.

## Team Members

| Member | Main area |
|---|---|
| [Jon Andrei] | Backend, routes, business logic |
| [Alhea and Kiara] | Frontend, pages, forms |
| [Martina] | Database, authentication, testing |

Roles overlapped in practice. The commit history and pull requests show who did what.

## Assigned System

Campus Maintenance Request System

## Features

- Registration, login, logout, and session timeout
- Three roles: requester, maintenance staff, admin
- Submit, view, edit and cancel maintenance requests (edit and cancel only while Pending)
- Admin assigns requests to technicians and sets priority
- Technicians update status (In Progress, Completed) and leave notes
- Status history for every request
- Search and filter by status, category, building and urgency
- Admin dashboard with counts and a list of the oldest unresolved requests
- Admin user management (create, change role, deactivate)
- Server-side validation on every form

## Technologies

Node.js, Express, EJS, MySQL (mysql2), express-session, bcryptjs, dotenv, express-validator, Bootstrap 5 (loaded from a CDN, so you need internet when viewing the pages).

## Installation

You need Node.js 18 or newer, Git, and a running MySQL server (MAMP works fine).

```bash
git clone [repository URL]
cd campus-maintenance
npm install
```

## Configuration

Copy the example environment file and fill in your own values.

```bash
cp .env.example .env
```

`.env.example` lists the variables:

```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=campus_maintenance
SESSION_SECRET=change_this_to_a_long_random_string
```

`.env` is in `.gitignore`. Never commit it. If you use MAMP, check its start page for the MySQL port and password; the defaults are often port 3306 on Windows and 8889 on Mac, with user `root`.

## Database Setup

1. Start MySQL (start the servers in MAMP).
2. Create the database and tables. Either open phpMyAdmin, go to the SQL tab, and paste in the contents of `config/schema.sql`, or run:
   ```bash
   mysql -u root -p < config/schema.sql
   ```
3. Load the test accounts and three sample requests:
   ```bash
   npm run seed
   ```

The seed script hashes the passwords with bcryptjs, so you cannot load it as plain SQL. It is safe to run more than once.

## How to Run

```bash
npm start
```

For auto-restart while developing, use `npm run dev`.

Open http://localhost:3000.

## User Accounts

Created by `npm run seed`. For testing only.

| Role | Email | Password |
|---|---|---|
| Admin | admin@campus.test | Admin123! |
| Maintenance | tech@campus.test | Tech123! |
| Requester | student@campus.test | Student123! |

New people who register themselves always get the requester role. Only an admin can create maintenance or admin accounts.

## Project Structure

```
campus-maintenance/
├── public/        static CSS, JS, images
├── views/         EJS templates
├── routes/        route definitions
├── controllers/   request handlers and business logic
├── models/        database queries
├── middleware/    auth, role checks, validation
├── config/        db.js, schema.sql, seed.js
├── docs/          REQUIREMENTS.md
├── app.js
├── package.json
├── .env
├── .gitignore
├── README.md
└── LICENSE
```

## Known Limitations

- No email or SMS notifications. Users have to log in to see status changes.
- No photo attachments on requests.
- A request can be assigned to only one technician at a time.
- No password reset flow yet.
- No CSRF tokens on forms (cookies use SameSite=Lax as partial protection).
- Sessions are kept in memory, so everyone is logged out when the server restarts.
- Bootstrap loads from a CDN, so the styling needs internet access.
- [Add anything else you find while testing.]

## AI Assistance Disclosure

We used Claude (Anthropic) during this project for [say exactly what: for example, drafting the requirements document and README, explaining Express session handling, and suggesting validation rules]. We reviewed, tested and edited what it produced, and every member can explain the code they submitted.

> Edit this paragraph so it matches what your team really did. Be specific, and add any other tools such as Copilot or ChatGPT.

## License

This project is released under the [MIT License](LICENSE).
