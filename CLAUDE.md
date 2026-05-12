# NomNom — Claude Code Instructions

## Project Overview

**NomNom** is a meal planning and diet/exercise tracking app for 2 users (for now).
**Domain:** `fit.spryszynski.pl`
**Character:** Side project with portfolio potential.

## Tech Stack

| Layer       | Technology                                                        |
|-------------|-------------------------------------------------------------------|
| Frontend    | React + TypeScript + Tailwind + Vite + vite-plugin-pwa            |
| Backend     | FastAPI + PostgreSQL + Redis                                       |
| AI tracker  | Claude Haiku (food/exercise parsing)                              |
| AI planner  | Claude Sonnet (meal generation, vision)                           |
| Nutrition   | USDA FoodData Central + Open Food Facts (fallback)                |
| Auth        | OAuth2 + JWT, hardcoded users, no registration                    |
| Deploy      | Docker Compose → VPS                                              |
| PWA         | vite-plugin-pwa (Workbox), static asset caching only              |

**Estimated API cost:** <$2/month with active use by 2 people.

## App Structure

### A: Meal Planner
1. User configures: days count, people count, dietary preferences
2. Claude Sonnet generates 10–12 dinner proposals (structured JSON)
3. User picks 7 (or however many) from a card list
4. Optional: chat-based modifications ("swap X for something lighter")
5. Confirm → backend aggregates ingredients → shopping list
6. Summary: calories/macros per day + week

### B: Daily Tracker
**Chat (food + exercise):**
- Text input or photo
- Photo → Claude Sonnet Vision → description → Nutrition API → kcal/macros
- Text → Claude Haiku → structured data → Nutrition API
- Rule: zero follow-up questions if AI >80% confident. "Banana" → 105 kcal, done.
- Exercise: MET values (static table ~200 activities), kcal = MET × weight_kg × time_h

**Daily Dashboard:**
- Calories in / out / net balance
- Macros: protein, fat, carbs (progress bars)
- Chronological entry list with icons (food/exercise)

**Measurements (weight + body metrics):**
- Form-based (not chat) — always available, no daily limit
- Weight trend chart
- EAV schema in DB — new parameters (body_fat, water, muscle_mass) without migrations

## DB Schema

```sql
-- Users (hardcoded, no registration)
users (id, name, email, hashed_password, calorie_target, weight_target, created_at)

-- Meal Planner
meal_plans (id, user_id, start_date, days_count, created_at)
meal_plan_items (id, meal_plan_id, day_number, meal_name, description, kcal, protein, fat, carbs, recipe_text)
shopping_lists (id, meal_plan_id, created_at)
shopping_list_items (id, shopping_list_id, ingredient, amount, unit, checked)

-- Daily Tracker
food_logs (id, user_id, logged_at, description, kcal, protein, fat, carbs, source_type, ai_confidence)
exercise_logs (id, user_id, logged_at, activity_type, duration_min, kcal_burned, met_value)

-- Body Measurements (EAV pattern)
body_measurements (id, user_id, measured_at, metric_type, value, unit)
-- metric_type: 'weight_kg', 'body_fat_percent', 'water_percent', etc.

-- ML / Preferences
meal_feedback (id, user_id, meal_name, features_json, chosen, created_at)
user_preference_profiles (id, user_id, profile_json, updated_at)
```

## Architectural Decisions

- **Haiku for tracking, Sonnet for planning** — cost savings without quality loss
- **EAV for body metrics** — flexible, no migrations needed
- **MET table as static JSON/DB seed** — no external API required
- **PWA: static asset caching only** — offline data sync is overkill for v1
- **Nutrition API fallback chain:** USDA → Open Food Facts → LLM estimation
- **Food photos:** Sonnet Vision → description → Nutrition API (no custom CV model)

## ML Strategy

**v1 — Dynamic Prompt (zero ML):**
- Collect feedback (what user chose vs. rejected)
- Build per-user JSON preference profile
- Inject into Claude system prompt at generation time
- Achieves ~90% of "learning preferences" effect

**v3 — Content-Based Filtering (scikit-learn, CPU):**
- Feature vector per meal: [macro%, prep_time, cuisine, main_ingredient, ...]
- Logistic regression or gradient boosting
- Offline training, model <10MB, inference <10ms
- A/B comparison with LLM baseline — good portfolio material

## Roadmap

### v1: Core
- [ ] Docker Compose scaffold (FastAPI + Postgres + Redis + React)
- [ ] Auth (OAuth2 + JWT, hardcoded users)
- [ ] PWA setup (vite-plugin-pwa)
- [ ] Meal Planner (A) — generation, selection, shopping list
- [ ] Daily Tracker (B) — chat (text + photos), dashboard, exercise
- [ ] Weight measurements (B) — form + trend chart
- [ ] ML: dynamic prompt (preference collection as JSON)

### v2: Social + Goals
- [ ] Goals (target weight, calorie deficit, progress tracking)
- [ ] Shared shopping list (WebSocket/polling + checkboxes)

### v2.5: Recipes
- [ ] Recipe generation for selected meals (Claude)
- [ ] Save to DB, build recipe database

### v3: Data + ML
- [ ] CSV export (food logs, exercise, weight)
- [ ] Content-based recommendation model (scikit-learn)
- [ ] Historical stats / trend charts

## Development Notes

- Backend API lives in `backend/`, frontend in `frontend/`
- Use `docker compose up` to run the full stack locally
- Two hardcoded users only — no self-registration flow
- All AI calls go through the backend; never expose API keys to the frontend
