# Cardia Hackathon Handoff

## What the demo includes

Cardia is a full-stack heart-risk screening demonstration based on the supplied Logistic Regression model. The responsive React interface uses the supplied animated Electric Border treatment around the model result card and a restrained OGL starfield background. The server validates the 11 model inputs, requires an educational-use acknowledgement, runs the pickle model through Python, and stores a minimal de-identified event record in the database.

> **Medical-use boundary:** Cardia is a hackathon demonstration and decision-support interface—not a diagnostic product, clinical triage service, or emergency tool. Every result screen communicates this boundary and directs consequential interpretation to a qualified clinician.

## Run locally

Install JavaScript dependencies with `pnpm install`. Install the pinned model runtime using `sudo uv pip install --system -r model/requirements.txt`, then run `pnpm dev`. Use `pnpm test` to execute validation, access-control, and real pickle-inference tests. Run `pnpm run build` before any deployment.

## Model integration

The supplied artifacts are at `model/heart/heart_model.pkl`, `model/heart/scaler.pkl`, and `model/heart/columns.pkl`. The `scripts/predict_heart.py` bridge reproduces the source preprocessing: one-hot encoding, serialized-column alignment, scaling, and `predict_proba`. `model/FEATURE_CONTRACT.md` records the accepted ranges, categories, and presentation boundary.

## Application flow and safeguards

The public `heartRisk.predict` procedure accepts only validated, acknowledged input. It applies a lightweight fixed-window request throttle, starts the Python process with a 15-second timeout, returns a probability plus either a **Lower** or **Elevated** model signal, and records a non-identifier event in `heartRiskHistory`. Public visitors cannot query historical screening records; `heartRisk.history` requires administrative access.

## Deploying the demo

The root `Dockerfile` is required because the production service needs Python alongside Node.js. It installs the package versions specified in `model/requirements.txt`, retains `model/heart/`, builds both React and Express code, and starts the server on the platform-provided port. Save a checkpoint before deployment so the Docker image contains all model files and the database migration.

## Real-world extension checklist

For use beyond the hackathon, add consent/legal review, clinician governance, per-user authentication, robust distributed rate limiting, encrypted storage policy, database backups, audit logging, monitoring, load testing, and a dedicated model-serving worker rather than one Python process per request. Do not use public or shared prediction histories for real health data.
