from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS # comment this on deployment
from collections import defaultdict
import pymongo
import os
import json
from bson import ObjectId

load_dotenv()

app = Flask(__name__, static_folder='frontend/build', static_url_path='/')
app.secret_key = os.getenv("APP_SECRET_KEY")
CORS(app)

db = pymongo.MongoClient(os.getenv("DB_CONN")).courses 
prereqs = defaultdict(list, db.graph.find_one({"_id": "prereq"}))
postreqs = defaultdict(list, db.graph.find_one({"_id": "postreq"}))

@app.route("/")
def index():
    return app.send_static_file("index.html")

@app.route("/api")
def api():
    fields = {"crosslistings": 1, "long_title": 1, "distribution_area_short": 1}
    details_fields = {"crosslistings": 1, "long_title": 1, "distribution_area_short": 1, "description": 1,
        "reading_writing_assignment": 1, "other_restrictions": 1}
    course_id = request.args.get("course_id")
    prereq_details = list(db.details.find({"_id": {"$in" : prereqs[course_id]}}, fields).sort("crosslistings", 1))
    postreq_details = list(db.details.find({"_id": {"$in" : postreqs[course_id]}}, fields).sort("crosslistings", 1))
    course_details = db.details.find_one({"_id": course_id}, details_fields)
    course_details['prereqs'] = prereq_details
    course_details['postreqs'] = postreq_details
    return jsonify(course_details)

@app.route("/search")
def search():
    query = request.args.get("query")
    results = list(db.details.aggregate([
        {
            "$search": {
            "index": "details",
            "text": {
                    "query": query,
                    "path": ["crosslistings", "long_title"]
                }
            }
        },
        { "$project": {
            "crosslistings": 1,
            "long_title": 1
        }},
        { "$limit": 5 }
    ]))
    return jsonify(results)

@app.route("/createtrack", methods = ["POST"])
def create_tracks():
    title = request.form.get("title")
    emoji = request.form.get("emoji")
    courses = json.loads(request.form.get("courses"))

    client = pymongo.MongoClient(os.getenv("DB_CONN"))
    db = client.courses
    db.tracks.insert_one({"title": title, "emoji": emoji, "courses": courses})
    return {"title": title, "emoji": emoji, "courses": courses}


@app.route("/tracks")
def get_tracks():
    fields = {"title": 1, "emoji": 1}
    client = pymongo.MongoClient(os.getenv("DB_CONN"))
    db = client.courses
    data = list(db.tracks.find({}, fields))
    response = app.response_class(
        response=json.dumps(data, default=str),
        status=200,
        mimetype='application/json'
    )
    return response

@app.route("/trackdetails")
def track_details():
    track_id = request.args.get("id")
    client = pymongo.MongoClient(os.getenv("DB_CONN"))
    db = client.courses
    track = db.tracks.find_one({"_id": ObjectId(track_id)})
    response = app.response_class(
        response=json.dumps(track, default=str),
        status=200,
        mimetype='application/json'
    )
    return response

if __name__ == "__main__":
    app.run()
