"""
Lightweight migration helper — runs at startup via init_db().

SQLAlchemy's create_all() creates missing tables but does NOT add columns to
existing tables. This module issues idempotent ALTER TABLE … ADD COLUMN IF NOT
EXISTS statements for every column that was added after the initial schema.

Add a new entry here whenever a column is added to a model.
"""

from sqlalchemy import text
from sqlalchemy.orm import Session


# Each entry: (table, column, sql_type_fragment)
_NEW_COLUMNS: list[tuple[str, str, str]] = [
    ("users", "tdee_kcal",       "INTEGER"),
    ("users", "goal_type",        "VARCHAR"),
    ("users", "protein_target",   "INTEGER"),
    ("users", "sex",              "VARCHAR"),
    ("users", "height_cm",        "FLOAT"),
    ("users", "weight_kg",        "FLOAT"),
    ("users", "birth_date",       "VARCHAR"),
    ("users", "language",         "VARCHAR DEFAULT 'pl'"),
]


def run_migrations(session: Session) -> None:
    for table, column, col_type in _NEW_COLUMNS:
        session.execute(
            text(
                f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {col_type}"
            )
        )
    session.commit()
