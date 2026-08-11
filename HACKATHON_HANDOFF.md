# StaySight Hackathon Handoff

## What is included

StaySight is a full-stack hotel booking cancellation predictor. The React interface uses the supplied **OGL Galaxy WebGL** component as a dark, interactive visual backdrop. The server validates booking inputs, invokes the supplied pickle model through Python, classifies the cancellation probability as **Low**, **Medium**, or **High**, and persists each result to the database-backed prediction history.

## Run locally

Install the JavaScript dependencies with `pnpm install`. Install the model runtime with `sudo uv pip install --system -r model/requirements.txt`, then start the project with `pnpm dev`. The development app is available through the managed preview. Run `pnpm test` for automated validation and `pnpm run build` for a production build check.

## Model integration

The three model artifacts live in `model/`: `hotel_booking_model.pkl`, `scaler.pkl`, and `columns.pkl`. `scripts/predict.py` performs the original project preprocessing sequence: one-hot encoding, column alignment, scaling, and `predict_proba`. The Node service invokes this script only after tRPC validates the incoming form data. `model/FEATURE_CONTRACT.md` describes every field and allowed category.

## Application flow

The client calls the public `prediction.predict` procedure. The service returns cancellation probability, confidence, an exact Low/Medium/High label, and an operational recommendation. It also creates a row in `predictionHistory`; `prediction.history` returns saved results for the reviewable history table.

## Deploying the demo

The project includes a root `Dockerfile` because the deployed server needs Python alongside Node.js. The image installs the pinned packages in `model/requirements.txt`, preserves the model files, builds the React client and Express server, and starts on the platform-assigned port. Before publishing, save a checkpoint and then use the workspace **Publish** control.

## Reusing this pattern for a hackathon model

Replace the contents of `model/` with the new model artifacts, update `scripts/predict.py` to reproduce the new model’s preprocessing exactly, update `model/FEATURE_CONTRACT.md`, and align the backend schema and `Home.tsx` form fields with that contract. The Galaxy component, result panel, risk mapping, history flow, database pattern, and test layout can remain as your starting framework.
