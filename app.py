import os
import base64
import numpy as np
import cv2
from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Servicio de reconocimiento facial activo"})

@app.route('/verify', methods=['POST'])
def verify_face():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"match": False, "error": "No se recibieron datos"}), 400
        
        captured_b64 = data.get("captured_image")
        reference_path = data.get("reference_image_path")
        
        if not captured_b64:
            return jsonify({"match": False, "error": "Falta la imagen capturada"}), 400
        if not reference_path:
            return jsonify({"match": False, "error": "Falta la ruta de la imagen de referencia"}), 400
            
        # Verificar que exista la imagen de referencia
        if not os.path.exists(reference_path):
            return jsonify({"match": False, "error": f"La imagen de referencia no existe en: {reference_path}"}), 400
            
        # Decodificar la imagen en base64 de la camara
        # Formato esperado: "data:image/jpeg;base64,..." o solo la cadena base64
        if "," in captured_b64:
            captured_b64 = captured_b64.split(",")[1]
            
        img_data = base64.b64decode(captured_b64)
        nparr = np.frombuffer(img_data, np.uint8)
        captured_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if captured_img is None:
            return jsonify({"match": False, "error": "No se pudo decodificar la imagen capturada"}), 400
            
        # Convertir a RGB (face_recognition usa RGB, OpenCV decodifica en BGR)
        captured_rgb = cv2.cvtColor(captured_img, cv2.COLOR_BGR2RGB)
        
        # Cargar imagen de referencia
        try:
            reference_img = face_recognition.load_image_file(reference_path)
        except Exception as e:
            return jsonify({"match": False, "error": f"Error al cargar la imagen de referencia: {str(e)}"}), 500
            
        # Obtener codificaciones (encodings) de caras
        captured_encodings = face_recognition.face_encodings(captured_rgb)
        reference_encodings = face_recognition.face_encodings(reference_img)
        
        if len(captured_encodings) == 0:
            return jsonify({"match": False, "error": "No se detectó ningún rostro en la foto de la cámara"}), 400
            
        if len(reference_encodings) == 0:
            return jsonify({"match": False, "error": "No se detectó ningún rostro en la foto de referencia registrada"}), 400
            
        # Comparar las caras
        match_results = face_recognition.compare_faces([reference_encodings[0]], captured_encodings[0], tolerance=0.5)
        face_distances = face_recognition.face_distance([reference_encodings[0]], captured_encodings[0])
        
        match = bool(match_results[0])
        distance = float(face_distances[0])
        
        return jsonify({
            "match": match,
            "distance": distance,
            "message": "Comparación realizada con éxito"
        })
        
    except Exception as e:
        return jsonify({"match": False, "error": f"Error interno en el servidor facial: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"Iniciando servidor de reconocimiento facial en el puerto {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
