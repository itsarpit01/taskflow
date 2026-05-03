# ⚡ TaskFlow — Team Task Manager

A full-stack team task management application with role-based access control, built with **Node.js + Express + SQLite** (backend) and **React + Vite** (frontend).

---

## 🔗 Links

- **Live URL**: https://taskflow-production-3758.up.railway.app
- **GitHub**: https://github.com/itsarpit01/taskflow 

---

## ✨ Features

### Authentication
- JWT-based signup/login
- Persistent sessions (7-day token)
- Protected routes on both frontend and backend

### Role-Based Access Control
| Feature | Admin | Member |
|---|---|---|
| View all projects | ✅ | ❌ (own only) |
| Create projects | ✅ | ✅ |
| Manage project members | ✅ (project admin) | ❌ |
| Create/edit tasks | ✅ | ✅ (own/assigned) |
| Delete tasks | ✅ | ✅ (own tasks) |
| User management panel | ✅ | ❌ |
| Change user roles | ✅ | ❌ |

### Projects
- Create, update, archive projects
- Add/remove team members with roles (admin/member)
- Project-level stats: total, todo, in progress, review, done, overdue

### Tasks
- Create tasks with title, description, status, priority, assignee, due date
- **Kanban view** (4 columns: To Do, In Progress, Review, Done)
- **List view** (sortable table)
- Filter by status and priority
- Inline task editing via modal
- Comment threads on tasks

### Dashboard
- Personal task overview
- Overdue task alerts
- Task status breakdown stats
- Recent project activity

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Database | SQLite (via sqlite3) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | express-validator |
| Frontend | React 18, React Router v6 |
| Bundler | Vite |
| Styling | Custom CSS (no framework) |
| Deployment | Railway |

---

## 🚀 Deployment (Railway)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: TaskFlow app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

### Step 2: Deploy on Railway
1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `taskflow` repository
4. Railway auto-detects `railway.toml` config

### Step 3: Set Environment Variables
In Railway dashboard → your service → **Variables**, add:
```
JWT_SECRET=your-super-secret-key-minimum-32-chars
NODE_ENV=production
```

### Step 4: Get your URL
Railway provides a public URL like https://taskflow-production.railway.app

---

## 💻 Local Development

### Prerequisites
- Node.js 18+
- npm

### Setup
```bash
# Clone the repo
git clone https://github.com/yourusername/taskflow.git
cd taskflow

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Run (two terminals)

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
# API runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

### Demo Accounts (auto-created on first boot)
| Email | Password | Role |
|---|---|---|
| aman@gmail.com | password1234 | Admin |
| sumit@gmail.com | password1234 | Member |
| abhi@gmail.com | password1234 | Member |

---

## 📡 REST API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/projects` | Any | List accessible projects |
| POST | `/api/projects` | Any | Create project |
| GET | `/api/projects/:id` | Member | Get project details |
| PUT | `/api/projects/:id` | Project Admin | Update project |
| DELETE | `/api/projects/:id` | Project Admin | Delete project |
| POST | `/api/projects/:id/members` | Project Admin | Add member |
| DELETE | `/api/projects/:id/members/:uid` | Project Admin | Remove member |

### Tasks
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/projects/:id/tasks` | Member | List tasks (filterable) |
| POST | `/api/projects/:id/tasks` | Member | Create task |
| PUT | `/api/projects/:id/tasks/:tid` | Member/Creator | Update task |
| DELETE | `/api/projects/:id/tasks/:tid` | Creator/Admin | Delete task |
| GET | `/api/projects/:id/tasks/:tid/comments` | Member | List comments |
| POST | `/api/projects/:id/tasks/:tid/comments` | Member | Add comment |

### Dashboard & Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard` | Any | Personal dashboard data |
| GET | `/api/users` | Admin | List all users |
| PUT | `/api/users/:id/role` | Admin | Change user role |

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # JWT auth + RBAC middleware
│   ├── routes/
│   │   ├── auth.js          # Login/signup routes
│   │   ├── projects.js      # Project CRUD + members
│   │   ├── tasks.js         # Task CRUD + comments
│   │   └── dashboard.js     # Dashboard + admin routes
│   ├── db.js                # SQLite schema + connection
│   ├── autoSeed.js          # Demo data on first boot
│   └── server.js            # Express app entry point
├── frontend/
│   └── src/
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── components/
│       │   └── Layout.jsx
│       ├── pages/
│       │   ├── Auth.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Projects.jsx
│       │   ├── ProjectDetail.jsx
│       │   └── UserPages.jsx
│       ├── api.js            # Fetch wrapper
│       ├── App.jsx           # Router
│       └── main.jsx
├── railway.toml              # Railway deploy config
├── package.json              # Root build scripts
└── README.md
```

---

## 🗄️ Database Schema

```sql
users (id, name, email, password, role, created_at)
projects (id, name, description, owner_id, status, created_at)
project_members (id, project_id, user_id, role, joined_at)
tasks (id, title, description, project_id, assignee_id, creator_id, status, priority, due_date, created_at, updated_at)
task_comments (id, task_id, user_id, content, created_at)
```

---

## 📝 License
MIT
