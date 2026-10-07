# E-Cell Management Platform

A full-stack Entrepreneurship Cell (E-Cell) web application designed to manage student entrepreneurship activities, events, startup ideas, announcements, team directories, memberships, and community blogs.

---

## 🚀 Features

- **Authentication & User Management**: Role-based access control (`STUDENT`, `COORDINATOR`, `ADMIN`), profile management, password reset.
- **Events & Registrations**: Create, view, register for upcoming entrepreneurship workshops, hackathons, and speaker sessions.
- **Idea Submission & Incubation**: Submit startup ideas, track review status, and receive feedback/mentorship.
- **Announcements & Broadcasts**: Campus-wide announcements with priority indicators and categorization.
- **Team & Leadership Directory**: Showcase core team members, faculty advisors, and domain leads.
- **Blog & Case Studies**: Entrepreneurial articles, founder stories, and workshop recaps.
- **Gallery**: Photo archive of past summits, e-weeks, and competitions.
- **Membership Applications**: Streamlined recruitment and onboarding workflows.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Bundler & Tooling**: Vite
- **Styling**: CSS / Modern Design System with responsive layouts

### Backend
- **Runtime**: Node.js & Express with TypeScript
- **ORM**: Prisma ORM
- **Database**: SQLite (default local development) / PostgreSQL ready
- **Security**: JWT Authentication, bcrypt password hashing, CORS, rate handling

---

## 📦 Project Structure

```
ecell/
├── backend/                # Express & TypeScript API server
│   ├── prisma/             # Database schema & seed scripts
│   ├── src/
│   │   ├── config/         # Database and server config
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth and error handling middleware
│   │   ├── routes/         # Express API routes
│   │   └── utils/          # Storage, response, and audit utilities
│   ├── .env.example        # Environment variable template
│   └── package.json
├── frontend/               # React + Vite frontend
│   ├── src/                # UI components and pages
│   ├── public/             # Static assets
│   └── package.json
└── README.md
```

---

## ⚡ Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn

### 2. Backend Setup
```bash
cd backend
npm install

# Copy example environment configuration
cp .env.example .env

# Generate Prisma client and seed sample data
npx prisma db push
npx prisma db seed

# Run backend development server
npm run dev
```
The backend API server will run at `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend
npm install

# Run frontend development server
npm run dev
```
The frontend application will run at `http://localhost:5173`.

---

## 🔒 Security & Environment Variables

Never commit `.env` files with secret keys or credentials. Configure your production environment variables using `backend/.env.example` as a reference.

---

## 📄 License

This project is licensed under the MIT License.
