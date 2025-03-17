from database.db_connection import db

def get_locations():
    return db.locations.find()
