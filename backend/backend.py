from flask import Flask, request, jsonify
import simulate

app = Flask(__name__)


@app.route("/simulate", methods=["POST"])
def data_endpoint():
    if request.is_json:
        data = request.get_json()
        # Process the JSON data here
        response = {"message": "JSON received!", "received_data": data}
        return jsonify(response), 200
    else:
        response = {"message": "Request was not JSON"}
        return jsonify(response), 400


if __name__ == "__main__":
    app.run(debug=True)
