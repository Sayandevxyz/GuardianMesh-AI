import pytest
import pytest_asyncio
import asyncio
from app.database.session import init_db
from app.database.seed import seed_data

@pytest_asyncio.fixture(scope="session", autouse=True)
async def initialize_test_database():
    await init_db()
    await seed_data()
