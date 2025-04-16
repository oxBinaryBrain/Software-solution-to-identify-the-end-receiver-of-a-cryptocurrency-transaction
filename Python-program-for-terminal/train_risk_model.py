import joblib
import numpy as np
from sklearn.ensemble import IsolationForest

# Sample transaction data (amounts in smallest units like Wei or Satoshis)
amounts = np.array([[100], [500], [10000], [200], [6000], [50], [700000]])  # Some normal, some outliers

# Train Isolation Forest model
risk_model = IsolationForest(contamination=0.1, random_state=42)
risk_model.fit(amounts)

# Save risk model
joblib.dump(risk_model, "risk_model.pkl")

print("✅ Risk scoring model saved.")
