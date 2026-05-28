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
    op.add_column('users', sa.Column('tdee_kcal', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('calorie_target', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('weight_target', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('goal_type', sa.Enum('lose', 'maintain', 'build', name='goaltype', native_enum=False, create_constraint=False), nullable=True))
    op.add_column('users', sa.Column('protein_target', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('sex', sa.Enum('M', 'F', name='sex', native_enum=False, create_constraint=False), nullable=True))
    op.add_column('users', sa.Column('height_cm', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('weight_kg', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('birth_date', sa.String(), nullable=True))
    op.add_column('users', sa.Column('language', sa.Enum('pl', 'en', name='language', native_enum=False, create_constraint=False), nullable=True))


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
