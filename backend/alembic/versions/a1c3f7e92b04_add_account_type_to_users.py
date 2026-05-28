"""add account_type to users

Revision ID: a1c3f7e92b04
Revises: df80e6e93637
Create Date: 2026-05-27 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1c3f7e92b04'
down_revision: Union[str, None] = 'df80e6e93637'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column(
            'account_type',
            sa.String(),
            nullable=False,
            server_default='demo',
        ),
    )


def downgrade() -> None:
    op.drop_column('users', 'account_type')
