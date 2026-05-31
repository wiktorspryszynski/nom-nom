"""add eaten_plan_items table

Revision ID: f1e2d3c4b5a6
Revises: a2b3c4d5e6f7
Create Date: 2026-05-31

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'f1e2d3c4b5a6'
down_revision: Union[str, None] = 'a2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'eaten_plan_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('plan_item_id', sa.Integer(), nullable=False),
        sa.Column('food_log_id', sa.Integer(), nullable=True),
        sa.Column('eaten_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['food_log_id'], ['food_logs.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['plan_item_id'], ['meal_plan_items.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('plan_item_id'),
    )


def downgrade() -> None:
    op.drop_table('eaten_plan_items')
