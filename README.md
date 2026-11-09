# Salarite Virtual HR Dashboard

A small ATS-style dashboard where an **employer assigns tasks to a Virtual HR**, the HR works on them and **schedules interviews** (voice, video or chat), and the employer follows progress **live**.

Built for the Salarite IT internship assignment with **FastAPI + SQLite** (backend) and **React** (frontend).

## Links

| | |
|---|---|
| **Live demo** | https://salarite-hr-app.onrender.com |
| **Source code** | https://github.com/deepaksharma02312-a11y/Salarite-hr |
| **API docs** | https://salarite-hr.onrender.com/docs |

> The app is on free hosting. If it has been idle, **the first load can take up to a minute** while the server wakes up. After that it is fast.

## Test accounts

Sample tasks and interviews are loaded automatically, so every account has something to look at.

| Role | Username | Password |
|---|---|---|
| Employer | `employer` | `employer123` |
| Virtual HR | `hr` | `hr123456` |
| Virtual HR (second) | `hr2` | `hr234567` |
| Employer (second) | `employer2` | `employer456` |

You can also create your own account from the login page (**Create an account**). Passwords need at least 8 characters.

## Two-minute walkthrough

1. Open the live link in a normal window and log in as **`employer`**. You will see a live task board (Pending, In progress, Completed) and a list of HRs to assign work to.
2. Assign a new task to `hr` using the **Assign a task** panel.
3. Open a **private window**, log in as **`hr`**. The new task is there with the employer's name on it.
4. As HR, open the **⋮ menu** on a task, choose **Move to In progress** and **Add note**.
5. Switch back to the employer window. The card moves to the new column and shows the HR note within a few seconds, with no refresh.
6. As HR, **schedule an interview**: pick the employer, date, **start and end time**, and the meeting type. Press **Start** to open the call placeholder.
7. As the employer, check the interview list, then use **Edit / reassign** on a task to hand it to `hr2`.

## What it does

**Employer**
- Assigns a task to a specific HR chosen from a list
- Edits a task, or reassigns it to another HR, until it is completed
- Deletes (cancels) a task
- Watches a live board and sees every interview scheduled for them

**Virtual HR**
- Sees only the tasks assigned to them, labelled with the employer who gave them
- Moves tasks between Pending, In progress and Completed and leaves progress notes
- Schedules interviews for a chosen employer with start time, end time and mode
- Starts a call from the interview card

**For everyone**
- Role-based access: users only see and change what belongs to them
- Auto refresh every 3 seconds, with a **Live** menu to refresh now or pause
- Notifications, search, and clickable summary cards that filter the board by status
- Sign up and login with salted password hashing

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy |
| Database | SQLite |
| Frontend | React 18, Vite, plain CSS |
| Real-time | Polling every 3 seconds |
| Hosting | Render (Web Service + Static Site) |

## Design decisions

- **Ownership on every record.** A task stores who created it and who it is assigned to, and an interview stores who scheduled it and for which employer. Every endpoint filters by that, so one HR can never read or change another HR's work.
- **Polling instead of WebSockets.** Simple, reliable on free hosting, and fast enough for a task board. WebSockets are the obvious upgrade.
- **Reassigning resets the task.** When a task moves to another HR it goes back to Pending and the old note is cleared, because the new HR has not started.
- **Sample data on startup.** If the database is empty the server loads sample tasks and interviews, so a reset on free hosting never leaves a blank dashboard.

## Run locally

**Backend**

```bash
cd backend
python -m venv venv
# Windows PowerShell
.\venv\Scripts\Activate.ps1
# Mac or Linux
# source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend** (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. If the backend is elsewhere, create `frontend/.env` with `VITE_API_URL=http://localhost:8000`.

## API

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/auth/register` | all | create an account |
| POST | `/auth/login` | all | log in, returns a token |
| GET | `/users/hrs` | employer | list HR accounts |
| GET | `/users/employers` | hr | list employer accounts |
| GET | `/tasks` | both | employer: tasks they gave. HR: tasks given to them |
| POST | `/tasks` | employer | assign a task to an HR |
| PUT | `/tasks/{id}` | employer | edit or reassign (not when completed) |
| PATCH | `/tasks/{id}` | hr | update status and note |
| DELETE | `/tasks/{id}` | employer | delete a task |
| GET | `/interviews` | both | HR: their interviews. Employer: interviews for them |
| POST | `/interviews` | hr | schedule an interview |
| PATCH | `/interviews/{id}` | hr | change interview status |
| POST | `/interviews/{id}/start` | hr | start the call placeholder |

Protected routes need the header `Authorization: Bearer <token>`. Interactive docs are at `/docs`.

## Deployment

**Backend** (Render Web Service): root `backend`, build `pip install -r requirements.txt`, start `uvicorn main:app --host 0.0.0.0 --port $PORT`, env `PYTHON_VERSION=3.11.9`.

**Frontend** (Render Static Site): root `frontend`, build `npm install && npm run build`, publish `dist`, env `VITE_API_URL=<backend URL>`.

## Known limitations and next steps

- **Calling is a placeholder.** A real voice, video or chat session would plug in at `/interviews/{id}/start` (WebRTC, Twilio or Daily.co).
- **Data is not permanent on free hosting.** SQLite lives on a temporary disk, so a restart can erase new data. Sample data returns automatically. Production would use Postgres.
- **Anyone can pick a role at signup.** A real product would let an admin assign roles.
- **A task goes to one HR at a time**, and there is no email or push delivery for notifications yet.
