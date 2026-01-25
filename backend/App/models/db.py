from sqlmodel import create_engine, Session
from App.models.models import DATABASE_URL

engine = create_engine(DATABASE_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session
