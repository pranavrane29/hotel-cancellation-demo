import json
import sys
from pathlib import Path

import joblib
import pandas as pd


MODEL_DIR = Path(__file__).resolve().parent.parent / "model" / "heart"


def load_artifacts():
    model = joblib.load(MODEL_DIR / "heart_model.pkl")
    scaler = joblib.load(MODEL_DIR / "scaler.pkl")
    columns = joblib.load(MODEL_DIR / "columns.pkl")
    return model, scaler, columns


def main():
    payload = json.loads(sys.stdin.read())
    model, scaler, columns = load_artifacts()
    features = pd.DataFrame([payload])
    encoded = pd.get_dummies(features).reindex(columns=columns, fill_value=0)
    scaled = scaler.transform(encoded)
    probabilities = model.predict_proba(scaled)[0]
    classes = list(model.classes_)
    probability = float(probabilities[classes.index(1)]) if 1 in classes else float(probabilities[-1])
    print(json.dumps({"heartDiseaseProbability": probability}))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"error": str(error)}))
        sys.exit(1)
