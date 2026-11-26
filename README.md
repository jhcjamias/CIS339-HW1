# Student Management System

CIS 3339 Homework 1: a full-stack app for managing students, courses, and enrollments, built with **Vue 3**, **Express**, and **MongoDB**.

**Application URL: <http://localhost:3000>**

The original assignment instructions are in [ASSIGNMENT.md](ASSIGNMENT.md).

---

## Quick Start

With MongoDB Community Edition already running locally, run these commands from the project root (the folder containing this README):

```bash
npm install
npm run build
npm start
```

Then open **<http://localhost:3000>**.

Each step is explained below.

---

## Required Software

| Software | Required version | Tested with |
|---|---|---|
| [Node.js](https://nodejs.org/) (includes npm) | 18 or newer | Node 24.21.0, npm 12.2.0 |
| [MongoDB Community Edition](https://www.mongodb.com/try/download/community) | 7.0 or newer | 9.0.8 and 7.0 |
| A modern web browser | Current Chrome, Edge, Firefox, or Safari | Chromium |

`mongosh` (the MongoDB Shell) is optional. It is useful for confirming that MongoDB is running and for inspecting the stored data.

---

## Environment Variables

The application reads its configuration from **[`backend/.env`](backend/.env)**. The file is committed to the repository, and a standard local setup needs no changes:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/cis3339_homework1
PORT=3000
```

| Variable | Required | Value | Purpose |
|---|---|---|---|
| `MONGODB_URI` | Yes | `mongodb://127.0.0.1:27017/cis3339_homework1` | Connection string for the local MongoDB server and database. No username or password is used. |
| `PORT` | No (defaults to `3000`) | `3000` | Port that the Express server listens on. |

The `cis3339_homework1` database does not need to exist in advance. On startup, the server automatically creates the database, its `students`, `courses`, and `enrollments` collections, and their indexes. **No setup, migration, seed, or import command is needed.**

---

## Step 1: Start MongoDB Community Edition

MongoDB must be running on `127.0.0.1:27017` (the default) before you use the application.

### macOS (Homebrew)

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

To stop it later: `brew services stop mongodb-community`

### Windows

1. Download and run the **MongoDB Community Server** installer (`.msi`) from <https://www.mongodb.com/try/download/community>.
2. During installation, leave **"Install MongoD as a Service"** selected. MongoDB then starts automatically.
3. If the service is stopped, start it from an **Administrator** terminal:

   ```powershell
   net start MongoDB
   ```

### Linux (systemd)

After installing MongoDB Community Edition using the [official instructions for your distribution](https://www.mongodb.com/docs/manual/administration/install-on-linux/):

```bash
sudo systemctl start mongod
```

### Confirm that MongoDB is running

```bash
mongosh --eval "db.runCommand({ ping: 1 })"
```

The output should include `ok: 1`.

---

## Step 2: Install Dependencies

From the **project root**:

```bash
npm install
```

This single command installs the dependencies for the root project, the backend (`backend/`), and the frontend (`frontend/`).

---

## Step 3: Build the Production Frontend

```bash
npm run build
```

This compiles the Vue application into `frontend/dist/`. The command should finish with a line like `✓ built in 400ms`.

---

## Step 4: Start the Server

```bash
npm start
```

Express serves both the REST API and the built Vue application. The terminal should show:

```
Server is running on http://localhost:3000
Connected to MongoDB database "cis3339_homework1".
```

To stop the server, press `Ctrl+C`.

---

## Step 5: Open the Application

Open **<http://localhost:3000>** in a browser.

| Page | URL | What you can do |
|---|---|---|
| Students | <http://localhost:3000/students> | Add, search (by name or ID), view, and delete students |
| Courses | <http://localhost:3000/courses> | Add, list, filter, and delete courses |
| Enrollments | <http://localhost:3000/enrollments> | Enroll a student in a course and list the students in a course |

All pages can be refreshed or opened directly by URL.

---

## Features

- **Students:** add a student with name, student ID, phone, and ZIP code; search by partial name or exact ID; view details; delete.
- **Courses:** add a course with course ID and name; list and filter all courses; delete.
- **Enrollments:** choose an existing student and course from lists loaded from the database; enroll; view each course's roster.
- **Validation:** every form checks its fields as you type, and the server checks them again.
- **Duplicate prevention:** duplicate student IDs, course IDs (case-insensitive, e.g. `cis 3339` = `CIS 3339`), and enrollments are rejected. Unique indexes enforce this in the database too.
- **Data integrity:** an enrollment can reference only an existing student and course. Deleting a student or course also deletes its enrollments.
- **Feedback:** loading indicators, success and error notifications, inline validation messages, and empty-data messages.
- **Responsive and accessible:** works at phone, tablet, and desktop widths; has labeled form controls, keyboard navigation, and a skip link.

---

## Project Structure

```
package.json              Root scripts: npm install / npm run build / npm start
backend/
  .env                    MongoDB connection string and port
  server.js               Express app: REST API + serves frontend/dist
  config/db.js            MongoDB connection, automatic retry, and database initialization
  models/                 Mongoose schemas: Student, Course, Enrollment
  routes/                 REST endpoints for students, courses, and enrollments
  utils/                  Error handling helpers
frontend/
  index.html              Vite entry page
  vite.config.js          Build settings and development proxy
  src/
    main.js               Creates the Vue app with Pinia and Vue Router
    App.vue               Page layout (header, main content, notifications)
    router/               Vue Router routes
    stores/               Pinia stores: students, courses, enrollments, notifications
    views/                Students, Courses, Enrollments, and Not Found pages
    components/           Reusable UI components
    composables/          Shared Composition API helpers
    api/                  HTTP client for the backend
    assets/main.css       Application styles
```

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3 (Composition API with `<script setup>`), Vue Router 4, Pinia 3, Vite 6 |
| Backend | Node.js, Express 5 |
| Database | MongoDB Community Edition, Mongoose 8 |
| Configuration | dotenv |

---

## REST API

All endpoints are under `/api` and return JSON.

| Method | Endpoint | Description | Success | Errors |
|---|---|---|---|---|
| GET | `/api/students?q=` | List all students, or search by partial name or exact ID | 200 | |
| GET | `/api/students/:id` | Get one student | 200 | 404 |
| POST | `/api/students` | Add a student: `{ name, id, phone, zip }` | 201 | 400 invalid, 409 duplicate ID |
| DELETE | `/api/students/:id` | Delete a student and their enrollments | 200 | 404 |
| GET | `/api/courses` | List all courses | 200 | |
| GET | `/api/courses/:courseId` | Get one course | 200 | 404 |
| POST | `/api/courses` | Add a course: `{ courseId, courseName }` | 201 | 400 invalid, 409 duplicate ID |
| DELETE | `/api/courses/:courseId` | Delete a course and its enrollments | 200 | 404 |
| GET | `/api/courses/:courseId/students` | List students enrolled in a course | 200 | 404 |
| GET | `/api/enrollments?courseId=&studentId=` | List enrollments, optionally filtered | 200 | |
| POST | `/api/enrollments` | Enroll a student: `{ studentId, courseId }` | 201 | 400 missing, 404 not found, 409 already enrolled |

If MongoDB is unavailable, API requests return **503** with a "database unavailable" message.

---

## Development Mode (Optional)

To get automatic reloading while editing the frontend, run the backend and the Vite development server in two terminals:

```bash
npm run dev:backend     # API on http://localhost:3000
npm run dev:frontend    # Vue app on http://localhost:5173 (forwards /api to port 3000)
```

The production workflow above (`npm run build` then `npm start`) is the one to use for grading.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| The server prints `MongoDB connection failed ... Retrying in 5s` | MongoDB is not running. Start it (Step 1). The server keeps retrying and connects automatically once MongoDB is available. |
| The browser shows "The frontend has not been built yet" | Run `npm run build`, then restart the server with `npm start`. |
| `npm start` fails with `EADDRINUSE` | Another program is using port 3000. Stop it, or change `PORT` in `backend/.env`. |
| A dependency is missing | Run `npm install` again from the project root. |
| Starting over with an empty database | Run `mongosh cis3339_homework1 --eval "db.dropDatabase()"`. The app recreates everything on its next start. |
