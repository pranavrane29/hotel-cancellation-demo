# Cardia Heart-Risk Model Contract

## Purpose and boundary

This application demonstrates a binary Logistic Regression screening model trained on the supplied heart-disease dataset. The model output is a **model probability**, not a medical diagnosis, clinical triage outcome, or emergency decision. The interface must never collect names, contact information, addresses, dates of birth, or other direct identifiers.

## Runtime artifacts

The server loads the user-supplied artifacts at `model/heart/heart_model.pkl`, `model/heart/scaler.pkl`, and `model/heart/columns.pkl`. The Python bridge uses `pandas`, `numpy`, `joblib`, and `scikit-learn` to one-hot encode the supplied fields, align them to the serialized training columns, apply the scaler, and return the probability associated with target class `1`.

## Required input contract

| Interface field | Model field | Allowed values |
|---|---|---|
| Age | `Age` | Integer 18–120 |
| Recorded sex | `Sex` | `M`, `F` |
| Chest pain type | `ChestPainType` | `ATA`, `NAP`, `ASY`, `TA` |
| Resting blood pressure | `RestingBP` | Integer 50–300 mm Hg |
| Cholesterol | `Cholesterol` | Integer 0–1,000 mg/dL |
| Fasting blood sugar | `FastingBS` | `0`, `1` |
| Resting ECG | `RestingECG` | `Normal`, `ST`, `LVH` |
| Maximum heart rate | `MaxHR` | Integer 30–260 |
| Exercise angina | `ExerciseAngina` | `Y`, `N` |
| ST depression | `Oldpeak` | Number −10–15 |
| ST slope | `ST_Slope` | `Up`, `Flat`, `Down` |

## Interpretation contract

The model uses a probability threshold of 50% for the presentation layer. Values below 50% display a **Lower** model signal; values at or above 50% display an **Elevated** model signal. Both screens explicitly state that the result requires clinician interpretation and is not a diagnosis.

## Persistence contract

Only the required model fields, computed probability, confidence, signal, acknowledgement, and timestamp are saved to `heartRiskHistory`. The demo does not request or store direct identifiers. Historical screening details are not exposed to public visitors; the router restricts the history procedure to authenticated administrative access.
