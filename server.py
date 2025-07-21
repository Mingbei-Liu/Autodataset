from flask import Flask, request, jsonify
import os

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/')
def home():
    return "CSV Uploader Server Running!"

@app.route('/upload', methods=['POST'])
def upload_files():
    if 'csvFiles' not in request.files:
        return jsonify({"error": "No files uploaded"}), 400

    files = request.files.getlist('csvFiles')
    for file in files:
        if file.filename.endswith('.csv'):
            file.save(os.path.join(UPLOAD_FOLDER, file.filename))

    return jsonify({"message": f"{len(files)} files uploaded successfully!"})

if __name__ == '__main__':
    app.run(debug=True)