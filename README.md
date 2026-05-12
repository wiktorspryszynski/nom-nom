# NomNom

Meal planning and diet/exercise tracking app for 2 users.<br>
Installable as a PWA on mobile and desktop.

**Domain:** `fit.spryszynski.pl`

---

## What it does

**Meal Planner** — Claude Sonnet generates a week of dinner proposals based on dietary preferences. Pick your meals, get a shopping list with aggregated ingredients, and see calorie/macro summaries.

**Daily Tracker** — Log food and exercise via text or photo. Claude Haiku parses text inputs; Sonnet Vision handles photos. Dashboard shows calories in/out, macros, and a chronological log. MET-based calorie burn for exercise.

**Body Measurements** — Form-based weight and body metric tracking with trend charts. EAV schema so new metrics can be added without DB migrations.

---

## Tech Stack

| Layer      | Technology                                          |
|------------|-----------------------------------------------------|
| Frontend   | React + TypeScript + Tailwind + Vite + PWA          |
| Backend    | FastAPI + PostgreSQL + Redis                        |
| AI         | Claude Haiku (tracker) + Claude Sonnet (planner)   |
| Nutrition  | USDA FoodData Central + Open Food Facts (fallback) |
| Auth       | OAuth2 + JWT, hardcoded users                       |
| Deploy     | Docker Compose → VPS                               |

---

## Getting Started

```bash
docker compose up
```

Frontend: http://localhost:5174  
Backend API: http://localhost:8001/docs

---

## Roadmap

- **v1** — Core: meal planner, daily tracker, weight tracking, dynamic preference learning
- **v2** — Goals, shared shopping list
- **v2.5** — Recipe generation and storage
- **v3** — CSV export, content-based ML recommendations

See `CLAUDE.md` for full architecture details, DB schema, and dev notes.
