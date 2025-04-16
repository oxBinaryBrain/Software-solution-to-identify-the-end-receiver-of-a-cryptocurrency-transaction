import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.model_selection import train_test_split

# Sample dataset of addresses with labels
addresses = [
    "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",  # Ethereum
    "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",  # Bitcoin
    "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080",  # Bitcoin (SegWit)
    "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",  # Ethereum
    "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy"  # Bitcoin
]
labels = ["Ethereum", "Bitcoin", "Bitcoin", "Ethereum", "Bitcoin"]

# Convert addresses into numerical features using character n-grams
vectorizer = CountVectorizer(analyzer='char', ngram_range=(2, 4))
X = vectorizer.fit_transform(addresses)
y = np.array([0 if label == "Ethereum" else 1 for label in labels])  # 0 = Ethereum, 1 = Bitcoin

# Train model
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# Save model and vectorizer
joblib.dump(model, "address_classifier.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")

print("✅ Address classification model and vectorizer saved.")
