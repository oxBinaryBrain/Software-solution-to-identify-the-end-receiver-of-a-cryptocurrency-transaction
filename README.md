# Software-solution-to-identify-the-end-receiver-of-a-cryptocurrency-transaction
Final Year Project git repo


# 🔎 Crypto Transaction Analyzer

A Python-based tool to trace Ethereum transactions and flag suspicious ones using machine learning and anomaly detection. Designed to support investigations of illicit cryptocurrency activity.

## 🚀 Features

- **Wallet Address Type Detection** (ML + rule-based fallback)
- **Transaction Tracking** via Etherscan API (up to 50 transactions)
- **Anomaly Detection** using Isolation Forest
- **Clear Display** of normal vs. suspicious transactions

## 🧠 Tech Stack

- Python
- scikit-learn (ML + anomaly detection)
- Etherscan API
- NumPy, Requests, Joblib

## ⚙️ Setup

```bash
git clone https://github.com/oxBinaryBrain/Software-solution-to-identify-the-end-receiver-of-a-cryptocurrency-transaction.git
cd Software-solution-to-identify-the-end-receiver-of-a-cryptocurrency-transaction
```
```bash
pip install -r requirements.txt
```

## Working
Detect wallet type
python main.py -w 0xYourWalletAddress

rack and analyze transactions
python main.py -t 0xYourWalletAddress
