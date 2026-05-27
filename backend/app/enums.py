"""Shared string enums used across models and routers.

All enums inherit from (str, enum.Enum) so they compare equal to plain strings
and serialise transparently — existing code that does `user.account_type == "demo"`
keeps working without change.

DB storage: columns use native_enum=False so PostgreSQL sees plain VARCHAR.
No migration is required when switching existing String columns to these types.
Adding a new enum *value* is also migration-free with this approach.
"""

import enum


class AccountType(str, enum.Enum):
    demo = "demo"
    full = "full"


class GoalType(str, enum.Enum):
    lose = "lose"
    maintain = "maintain"
    build = "build"


class Sex(str, enum.Enum):
    M = "M"
    F = "F"


class Language(str, enum.Enum):
    pl = "pl"
    en = "en"


class FoodSourceType(str, enum.Enum):
    text = "text"
    photo = "photo"
    manual = "manual"
    usda = "usda"


class MetricType(str, enum.Enum):
    weight_kg = "weight_kg"
    body_fat_percent = "body_fat_percent"
    water_percent = "water_percent"
    muscle_mass_percent = "muscle_mass_percent"
    water_glasses = "water_glasses"
