from flask import Flask, jsonify
from flask_cors import CORS
import db

app = Flask(__name__)
CORS(app)

@app.route("/api/games", methods=["GET"])
def get_games():
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT g.title, g.price, g.play_count, r.rating_name
            FROM game g
            JOIN game_rating r ON g.rating_id = r.rating_id
            WHERE g.title IS NOT NULL AND g.play_count IS NOT NULL
        """)
        results = cursor.fetchall()
        data = [
            {
                "title": row[0],
                "price": float(row[1]),
                "play_count": row[2],
                "rating": row[3]
            }
            for row in results
        ]
        return jsonify(data)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Failed to fetch data"}), 500