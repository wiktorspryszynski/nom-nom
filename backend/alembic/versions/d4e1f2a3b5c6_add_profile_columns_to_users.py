"""add profile columns to users

Revision ID: d4e1f2a3b5c6
Revises: c28267b1453c
Create Date: 2026-05-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd4e1f2a3b5c6'
down_revision: Union[str, None] = 'c28267b1453c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS tdee_kcal INTEGER")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS calorie_target INTEGER")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS weight_target FLOAT")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS goal_type VARCHAR")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS protein_target INTEGER")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS sex VARCHAR")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS height_cm FLOAT")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS weight_kg FLOAT")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date VARCHAR")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR")


def downgrade() -> None:
    op.drop_column('users', 'language')
    op.drop_column('users', 'birth_date')
    op.drop_column('users', 'weight_kg')
    op.drop_column('users', 'height_cm')
    op.drop_column('users', 'sex')
    op.drop_column('users', 'protein_target')
    op.drop_column('users', 'goal_type')
    op.drop_column('users', 'weight_target')
    op.drop_column('users', 'calorie_target')
    op.drop_column('users', 'tdee_kcal')
