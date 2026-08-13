# ForForms — Typeform Clone

A full-stack Typeform clone that replicates the signature conversational form-building and form-filling experience. Built with **Next.js (TypeScript)** frontend and **Python FastAPI** backend with **SQLite** database.

![ForForms](https://img.shields.io/badge/ForForms-Typeform%20Clone-6C5CE7)

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, TypeScript, Vanilla CSS |
| **Backend** | Python 3.12+, FastAPI, SQLAlchemy ORM |
| **Database** | SQLite (file-based, zero-config) |
| **Architecture** | MVC (Model-View-Controller) |

---

## 📋 Features

### Core Features
- ✅ **Form Builder** — Three-panel layout with drag-and-drop question reordering
- ✅ **8 Question Types** — Short text, long text, multiple choice, dropdown, email, number, yes/no, rating
- ✅ **Per-question Settings** — Required toggle, description/help text, type-specific config
- ✅ **Live Preview** — See answer preview as you build
- ✅ **Form Management** — Create, rename, duplicate, delete forms
- ✅ **Publish/Unpublish** — Generate shareable public links
- ✅ **Respondent Flow** — Typeform's signature one-question-at-a-time with smooth animations
- ✅ **Keyboard Navigation** — Enter to advance, arrow keys, auto-advance on selection
- ✅ **Progress Bar** — Visual progress indicator
- ✅ **Welcome & Thank You Screens** — Customizable content
- ✅ **Client + Server Validation** — Required fields, email format, number format
- ✅ **Results Dashboard** — Summary stats and responses table
- ✅ **Individual Response Detail** — Drill-down into each submission
- ✅ **CSV Export** — Download all responses as CSV
- ✅ **Custom Themes** — Primary color and background customization
- ✅ **Toast Notifications** — Success/error feedback
- ✅ **Seed Data** — 3 sample forms with 8 responses pre-populated

### Placeholder Features
- ⏳ Logic jumps / branching
- ⏳ Integrations / webhooks
- ⏳ Team collaboration
- ⏳ File upload question type

---

## 🏗️ Architecture Overview

```
forforms/
├── backend/                  # FastAPI Python backend
│   ├── app/
│   │   ├── main.py           # App entry point, CORS, startup
│   │   ├── database.py       # SQLite + SQLAlchemy setup
│   │   ├── models/           # MODEL — ORM models
│   │   ├── controllers/      # CONTROLLER — Business logic
│   │   ├── views/            # VIEW — Route handlers
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   └── seed.py           # Sample data seeder
│   └── requirements.txt
├── frontend/                 # Next.js TypeScript frontend
│   ├── src/
│   │   ├── app/              # Pages (App Router)
│   │   │   ├── page.tsx      # Dashboard
│   │   │   ├── forms/[id]/edit/     # Form Builder
│   │   │   ├── forms/[id]/results/  # Results
│   │   │   └── f/[shareId]/         # Public respondent flow
│   │   ├── components/       # Reusable UI components
│   │   ├── lib/              # API client, utilities
│   │   └── types/            # TypeScript type definitions
│   └── package.json
└── README.md
```

### MVC Pattern (Backend)

| Layer | Directory | Responsibility |
|-------|-----------|---------------|
| **Model** | `app/models/` | SQLAlchemy ORM models — database table mappings |
| **Controller** | `app/controllers/` | Business logic — validation, transformations, DB orchestration |
| **View** | `app/views/` | FastAPI route handlers — HTTP request/response handling |

---

## 🗄️ Database Schema

```
┌──────────────────┐     ┌──────────────────────┐
│      forms       │     │      questions        │
├──────────────────┤     ├──────────────────────┤
│ id (PK, UUID)    │────┐│ id (PK, UUID)        │
│ title            │    ││ form_id (FK)         │
│ description      │    ││ type (enum)          │
│ status           │    ││ title                │
│ share_id (unique)│    ││ description          │
│ theme_settings   │    ││ order_index          │
│ welcome_screen_* │    ││ is_required          │
│ thankyou_screen_*│    ││ properties (JSON)    │
│ created_at       │    ││ created_at           │
│ updated_at       │    ││ updated_at           │
└──────────────────┘    │└──────────────────────┘
                        │
┌──────────────────┐    │┌──────────────────────┐
│    responses     │    ││       answers         │
├──────────────────┤    │├──────────────────────┤
│ id (PK, UUID)    │───┐││ id (PK, UUID)        │
│ form_id (FK)     │←──┘││ response_id (FK)     │
│ submitted_at     │    ││ question_id (FK)     │
│ metadata (JSON)  │    └│ value (text)         │
└──────────────────┘     └──────────────────────┘
```

**Relationships:**
- Form → Questions (1:N, cascade delete)
- Form → Responses (1:N, cascade delete)
- Response → Answers (1:N, cascade delete)
- Question → Answers (1:N, cascade delete)

---

## 🔌 API Overview

### Forms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/forms` | List all forms |
| POST | `/api/forms` | Create form |
| GET | `/api/forms/{id}` | Get form detail |
| PUT | `/api/forms/{id}` | Update form |
| DELETE | `/api/forms/{id}` | Delete form |
| POST | `/api/forms/{id}/duplicate` | Duplicate form |
| POST | `/api/forms/{id}/publish` | Publish form |
| POST | `/api/forms/{id}/unpublish` | Unpublish form |

### Questions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/forms/{id}/questions` | Add question |
| PUT | `/api/forms/{id}/questions/{qid}` | Update question |
| DELETE | `/api/forms/{id}/questions/{qid}` | Delete question |
| PUT | `/api/forms/{id}/questions/reorder` | Reorder questions |

### Public (No Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/forms/{shareId}` | Get published form |
| POST | `/api/public/forms/{shareId}/responses` | Submit response |

### Responses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/forms/{id}/responses` | List responses |
| GET | `/api/forms/{id}/responses/{rid}` | Get response detail |
| GET | `/api/forms/{id}/responses/summary` | Summary stats |
| GET | `/api/forms/{id}/responses/export` | Export CSV |
| DELETE | `/api/forms/{id}/responses/{rid}` | Delete response |

---

## 🛠️ Setup Instructions

### Prerequisites
- **Python 3.10+** with pip
- **Node.js 18+** with npm
- **Git**

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
The backend will start at `http://localhost:8000` and automatically:
- Create the SQLite database
- Run migrations (create all tables)
- Seed the database with 3 sample forms and 8 responses

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will start at `http://localhost:3000`.

### Access the App
- **Dashboard:** http://localhost:3000
- **API Docs:** http://localhost:8000/docs (Swagger UI)
- **Sample Form:** http://localhost:3000/f/feedback1

---

## 📝 Assumptions

1. **Authentication:** Simplified — assumes a single default logged-in creator. No login page.
2. **Database:** SQLite for simplicity. Schema designed for easy migration to PostgreSQL.
3. **File Storage:** Not implemented — forms use JSON fields for type-specific configuration.
4. **Real-time:** No WebSocket — results page requires manual refresh.
5. **Deployment:** Designed for local development. Environment variables for production URLs.

---

## 📂 Seed Data

The app comes pre-seeded with:
1. **Customer Feedback Survey** — Published, 5 responses, 5 questions (rating, multiple choice, long text, yes/no, email)
2. **Job Application Form** — Published, 3 responses, 6 questions (short text, email, number, dropdown, long text, multiple choice)
3. **Tech Conference Registration** — Draft, 0 responses, 4 questions (short text, email, dropdown, yes/no)
