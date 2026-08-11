import json
import sys
from pathlib import Path

import joblib
import pandas as pd


MODEL_DIR = Path(__file__).resolve().parent.parent / "model"


def load_artifacts():
    model = joblib.load(MODEL_DIR / "hotel_booking_model.pkl")
    scaler = joblib.load(MODEL_DIR / "scaler.pkl")
    columns = joblib.load(MODEL_DIR / "columns.pkl")
    if hasattr(model, "n_jobs"):
        model.n_jobs = 1
    return model, scaler, columns


def cancellation_probability(model, features):
    probabilities = model.predict_proba(features)[0]
    classes = list(model.classes_)
    if 1 in classes:
        return float(probabilities[classes.index(1)])
    return float(probabilities[-1])


def main():
    payload = json.loads(sys.stdin.read())
    model, scaler, columns = load_artifacts()
    booking = pd.DataFrame([payload])
    encoded = pd.get_dummies(booking).reindex(columns=columns, fill_value=0)
    scaled = scaler.transform(encoded)
    print(json.dumps({"cancellationProbability": cancellation_probability(model, scaled)}))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"error": str(error)}))
        sys.exit(1)
