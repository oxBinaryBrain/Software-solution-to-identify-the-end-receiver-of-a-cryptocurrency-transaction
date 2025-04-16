# Software Solution to Identify the End Receiver of a Cryptocurrency Transaction



# 🕵️‍♂️ Tracing the End Receiver of Cryptocurrency Transactions

A project focused on identifying the real recipient in cryptocurrency transactions, with a special focus on illegal drug trade. It combines blockchain analysis and anomaly detection to flag suspicious transactions.

## 🌐 Live Demo

👉 [View Website](https://your-vercel-project-url.vercel.app)  
_Deployed using Vercel with TypeScript + JavaScript frontend._

## 🚀 Features

- 🔎 Detects suspicious transactions using anomaly detection (Isolation Forest)
- 📊 Extracts transaction data via Etherscan API
- 🧠 Predicts wallet type using ML or rule-based logic
- 🧹 Filters and displays only relevant or suspicious activity
- 🧪 CLI interface for quick testing and insights

## 🛠️ Tech Stack

- **Backend**: Python (Scikit-learn, Joblib)
- **ML Model**: Random Forest (for address classification)
- **Anomaly Detection**: Isolation Forest
- **Frontend**: TypeScript, JavaScript (Vercel-hosted site)
- **API**: Etherscan API

## 📦 Installation ( For running only the python based program in terminal)

```bash
git clone https://github.com/oxBinaryBrain/Software-solution-to-identify-the-end-receiver-of-a-cryptocurrency-transaction.git
cd Software-solution-to-identify-the-end-receiver-of-a-cryptocurrency-transaction
pip install -r requirements.txt


## Working

```bash
#Detect wallet type
python main.py -w 0xYourWalletAddress

#Track and analyze transactions
python main.py -t 0xYourWalletAddress

#Suspicious transactions are shown separately at the end.
```
## ✅ Expected Outcomes

- Highlighting unusual transaction values  
- Detecting potential money laundering loops  
- Predictive behavior scoring for wallet types  
- Helps law enforcement trace illicit financial flows

## 📌 Conclusion
This tool enhances transparency and accountability in crypto transactions, particularly in illicit domains. It can be integrated into larger blockchain analytics systems or used as a standalone inspection tool for investigative purposes.
