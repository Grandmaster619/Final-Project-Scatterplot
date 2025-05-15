from psycopg import connect
from bottle import Bottle, template, request, static_file, response
from decimal import Decimal
import logging
import json

fmt = "%(levelname)s\t%(funcName)s():%(lineno)i\t%(message)s"
logging.basicConfig(level=logging.DEBUG, format=fmt)
logger = logging.getLogger(__name__)

app = Bottle()

@app.route('/static/<filepath:path>')
def server_static(filepath):
    return static_file(filepath, root='static')

def convert_decimals(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

@app.route('/data')
def data():
    try:
        # Database connection setup
        conn = connect(
            host="marigold.csse.uwplatt.edu",
            dbname='cleavera',
            user='cleavera',
            port='5432',
            password='password',
            autocommit=True
        )
        cursor = conn.cursor()
        cursor.execute("SET search_path TO final_project_scatterplot;")
        cursor.execute('''
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
            WHERE sg.price_original IS NOT NULL AND sg.user_reviews IS NOT NULL;
        ''')
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        # Format data as list of dictionaries
        data = [
            {
                "app_id": row[0],
                "title": row[1],
                "price_original": row[3],
                "user_reviews": row[4],
                "rating_name": row[5],
                "positive_ratio": row[6]
            }
            for row in rows
        ]
        response.content_type = 'application/json'
        return json.dumps(data, default=convert_decimals)

    except Exception as e:
        logger.error(e)
        response.content_type = 'application/json'
        return json.dumps({"error": str(e)})


@app.route('/')
@app.route('/scatterplot')
def show_viz():
    output = template('scatterplot')
    return output

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8080, reloader=True)
