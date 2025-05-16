from psycopg import connect
from bottle import Bottle, template, request, static_file, response
from datetime import date, datetime
from decimal import Decimal
import json
import logging

logging.basicConfig(level=logging.DEBUG, format="%(levelname)s %(message)s")
app = Bottle()

@app.route("/static/<filepath:path>")
def server_static(filepath):
    return static_file(filepath, root="static")

def convert_types(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, (date, datetime)):
        return obj.isoformat()  # convert date/datetime to ISO string
    raise TypeError(f"Type {type(obj)} not serializable")

@app.route("/data")
def data():
    try:
        min_price = request.query.get("priceMin", default=0, type=float)
        max_price = request.query.get("priceMax", default=1000, type=float)
        min_reviews = request.query.get("reviewsMin", default=30, type=int)
        max_reviews = request.query.get("reviewsMax", default=10000000, type=int)

        conn = connect(
            host="marigold.csse.uwplatt.edu",
            dbname="cleavera",
            user="cleavera",
            port="5432",
            password="password",
            autocommit=True,
        )
        cursor = conn.cursor()
        cursor.execute("SET search_path TO final_project_scatterplot;")
        cursor.execute(
            """
            SELECT
                sg.app_id,
                sg.title,
                sg.date_release,
                sg.price_original,
                sg.user_reviews,
                gr.rating_name,
                sg.positive_ratio
            FROM steam_games sg
            JOIN game_rating gr ON sg.rating_id = gr.rating_id
            WHERE sg.price_original BETWEEN %s AND %s
            AND sg.user_reviews BETWEEN %s AND %s
            AND sg.price_original IS NOT NULL
            AND sg.user_reviews IS NOT NULL;
        """,
            (min_price, max_price, min_reviews, max_reviews),
        )

        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        data = [
            {
                "app_id": row[0],
                "title": row[1],
                "date_release": row[2],
                "price_original": row[3],
                "user_reviews": row[4],
                "rating_name": row[5],
                "positive_ratio": row[6],
            }
            for row in rows
        ]

        response.content_type = "application/json"
        return json.dumps(data, default=convert_types)
    except Exception as e:
        logging.error(e)
        response.content_type = "application/json"
        return json.dumps({"error": str(e)})

@app.route("/")
@app.route("/scatterplot")
def show_viz():
    return template("scatterplot")

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8080, reloader=True)
