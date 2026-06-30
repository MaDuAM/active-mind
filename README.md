# 🧠 ActiveMind

**ActiveMind** is a knowledge and action management tool designed for structuring information, tracking strategies, and making progress visible.  
It supports three core areas: **Knowledge**, **Passive Actions**, and **Active Actions** – with a strong focus on clarity, consistency, and user experience.

---

## 🚀 Features

- **Three entry types:** Knowledge, Passive, Active (with step-by-step tracking)
- **Dashboard & Topic views** with collapsible sections
- **Soft delete & restore** with a dedicated trash view
- **Full-text search** with live suggestions and result overlay
- **Tracking log** for every entry (status changes, step changes, notes)
- **Dark / Light mode**
- **Responsive design** (Desktop, Tablet, Mobile)
- **Keyboard shortcuts** (e.g. `⌘N` for new entry)
- **Mobile bottom navigation** with quick actions

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, React Router |
| Backend | Node.js, Express, PostgreSQL, Prisma |
| State & Cache | React Query, Context API |
| Styling | Tailwind CSS with Dark Mode support |
| Build Tool | Vite |

---

## 📦 Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/active-mind.git
cd active-mind

# Install dependencies (frontend & backend)
cd frontend && npm install
cd ../backend && npm install

# Set up environment variables (see .env.example)
# Start the backend
cd backend && npm run dev

# Start the frontend (in a separate terminal)
cd frontend && npm run dev

---

## 📁 Project Structure

active-mind/
├── backend/
│   ├── prisma/          # Database schema
│   └── src/             # API routes, controllers, auth
├── frontend/
│   ├── public/          # Static assets
│   └── src/
│       ├── components/  # UI components
│       ├── context/     # Auth, Notification
│       ├── hooks/       # Custom React hooks
│       ├── lib/         # API client, utilities
│       └── pages/       # Dashboard, TopicView, Trash
└── README.md

---

## 🧪 Testing & Quality

- Manual testing (Desktop)
- Error boundaries for graceful fallbacks
- Soft-delete & permanent delete with confirmation dialogs

---

## 📄 License

This project is for demonstration and portfolio purposes.

---

## 👤 Author

Martin – https://github.com/MaDuAM/active-mind

Built with clarity, consistency, and a focus on meaningful progress.
