import os
import argparse
import joblib
import re
import requests
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.feature_extraction.text import CountVectorizer

# Load pre-trained ML model (train separately and save using joblib)
MODEL_PATH = "address_classifier.pkl"
VECTORIZER_PATH = "vectorizer.pkl"
ETHERSCAN_API_KEY = "I8NSUCWSU6SZV31SARU9HEJZ1X6ZQUBDC1"

if os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH):
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
else:
    model, vectorizer = None, None

# Argument parsing
parser = argparse.ArgumentParser()
parser.add_argument('-w', '--whataddress', help='Get type of wallet address', dest='whataddress')
parser.add_argument('-t', '--track', help='Get all transactions from an address', dest='track')
args = parser.parse_args()

# Blockchain address patterns (rule-based fallback)
ADDRESS_PATTERNS = {
    "Ethereum (ETH)": r"^0x",
    "Bitcoin (BTC)": r"^1|^3",
    "Bitcoin Cash (BCH)": r"^bitcoincash:q",
    "Cardano (ADA)": r"^addr",
    "Cosmos (ATOM)": r"^cosmos",
    "Dash (DASH)": r"^X",
    "Dogecoin (DOGE)": r"^D",
    "Litecoin (LTC)": r"^M",
    "Ripple (XRP)": r"^r",
    "Stellar (XLM)": r"^G",
    "Tezos (XTZ)": r"^tz",
    "Tron (TRX)": r"^T"
}

def predict_address_type(address):
    """Predict the blockchain type using ML model if available, otherwise use rule-based approach."""
    if model and vectorizer:
        features = vectorizer.transform([address])
        prediction = model.predict(features)[0]
        return f"Predicted (ML): {prediction}"
    
    # Rule-based fallback
    for blockchain, pattern in ADDRESS_PATTERNS.items():
        if re.match(pattern, address):
            return f"Matched Rule: {blockchain}"
    
    return "Unknown Address Type"

def whataddress():
    addresses = args.whataddress.split(',')
    for addr in addresses:
        print(f"{addr}: {predict_address_type(addr)}")

def detect_anomalies(transactions):
    """Detect anomalies in transactions using Isolation Forest."""
    if not transactions:
        print("No transactions to analyze.")
        return []
    
    amounts = np.array([float(tx['value']) for tx in transactions if tx['value'].isdigit()]).reshape(-1, 1)
    
    if len(amounts) < 2:  # IsolationForest requires multiple data points
        print("Not enough transactions to perform anomaly detection.")
        return []
    
    iso_forest = IsolationForest(contamination=0.05, random_state=42)
    anomalies = iso_forest.fit_predict(amounts)
    
    suspicious_transactions = [transactions[i] for i in range(len(transactions)) if anomalies[i] == -1]
    return suspicious_transactions

def track_transactions(address):
    """Track transactions of a given Ethereum wallet address using Etherscan API."""
    api_url = f"https://api.etherscan.io/api?module=account&action=txlist&address={address}&startblock=0&endblock=99999999&sort=asc&apikey={ETHERSCAN_API_KEY}"
    response = requests.get(api_url)
    
    if response.status_code == 200:
        transactions = response.json()
        if transactions["status"] == "1":
            all_transactions = transactions["result"]

            if not all_transactions:
                print(f"No transactions found for {address}.")
                return
            
            suspicious_transactions = detect_anomalies(all_transactions)
            
            print(f"\n📌 Showing first 50 transactions for {address}:\n{'='*50}")
            for tx in all_transactions[:50]:  # Limit output to 50 transactions
                print(f"Transaction Hash: {tx['hash']}\nFrom: {tx['from']}\nTo: {tx['to']}\nValue: {int(tx['value']) / 10**18} ETH\nGas Used: {tx['gasUsed']}\nGas Price: {int(tx['gasPrice']) / 10**9} Gwei\nTimestamp: {tx['timeStamp']}\n{'='*50}\n")
            
            if suspicious_transactions:
                print("\n🚨 Suspicious Transactions Detected 🚨\n" + "="*50)
                for stx in suspicious_transactions[:50]:  # Limit suspicious output to 50
                    print(f"Transaction Hash: {stx['hash']}\nFrom: {stx['from']}\nTo: {stx['to']}\nValue: {int(stx['value']) / 10**18} ETH\nGas Used: {stx['gasUsed']}\nGas Price: {int(stx['gasPrice']) / 10**9} Gwei\nTimestamp: {stx['timeStamp']}\n{'='*50}\n")
            else:
                print("\n✅ No suspicious transactions detected.\n")
        else:
            print(f"No transactions found for {address}.")
    else:
        print(f"Failed to fetch transactions for {address}. HTTP Status Code: {response.status_code}")

# Execute function
if args.whataddress:
    whataddress()
elif args.track:
    track_transactions(args.track)
else:
    print("Please provide a wallet address using -w or --whataddress, or track transactions using -t or --track")
