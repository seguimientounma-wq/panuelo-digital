import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from google.oauth2 import service_account
from googleapiclient.discovery import build
import json

app = Flask(__name__)
CORS(app)

# Aseguramos que Vercel encuentre la instancia de la aplicación
application = app

SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
SPREADSHEET_ID = os.environ.get("SPREADSHEET_ID", "")
RANGE_NAME = 'Comunicaciones!A:M'

def get_sheets_service():
    # Vercel leerá las credenciales desde la variable de entorno segura
    creds_json = json.loads(os.environ.get("GOOGLE_CREDENTIALS_JSON", "{}"))
    creds = service_account.Credentials.from_service_account_info(creds_json, scopes=SCOPES)
    return build('sheets', 'v4', credentials=creds)

@app.route('/api/comunicaciones', methods=['GET'])
def obtener_comunicaciones():
    try:
        service = get_sheets_service()
        sheet = service.spreadsheets()
        result = sheet.values().get(spreadsheetId=SPREADSHEET_ID, range=RANGE_NAME).execute()
        rows = result.get('values', [])
        
        if not rows:
            return jsonify([]), 200
            
        headers = rows[0]
        records = []
        for index, row in enumerate(rows[1:]):
            record = {headers[i]: row[i] if i < len(row) else "" for i in range(len(headers))}
            record['id'] = index + 2 
            records.append(record)
            
        return jsonify(records), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/comunicaciones/estado', methods=['POST'])
def actualizar_estado():
    data = request.json
    fila_id = data.get('id')
    nuevo_estado = data.get('Estado')
    
    estados_validos = ["En proceso", "En desarrollo", "Terminado"]
    if nuevo_estado not in estados_validos:
        return jsonify({"error": "Estado no válido"}), 400
        
    try:
        service = get_sheets_service()
        # La columna Estado es la J en la Google Sheet
        rango_actualizar = f'Comunicaciones!J{fila_id}'
        
        body = {'values': [[nuevo_estado]]}
        service.spreadsheets().values().update(
            spreadsheetId=SPREADSHEET_ID,
            range=rango_actualizar,
            valueInputOption='RAW',
            body=body
        ).execute()
        
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
