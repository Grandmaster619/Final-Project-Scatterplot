import psycopg2
import os

def get_connection():
    return psycopg2.connect(
        dbname="steamdb",
        user="youruser",
        password="yourpassword",
        host="localhost"
    )