
import { Address, Transaction, TransactionNode } from './mockData';
import { calculateEnhancedRiskScore, detectAnomalies } from './mlAnalyzer';

interface AnalysisResult {
  transactionNodes: TransactionNode[];
  mixers: string[];
  endReceivers: string[];
  cryptoType: string;
  anomalies?: number[];
  mlInsights?: string[];
}

// Get crypto type from wallet address format
export const identifyCryptoType = (address: string): string => {
  // Simple heuristic based on address format
  if (address.startsWith('1') || address.startsWith('3') || address.startsWith('bc1')) {
    return 'BTC';
  } else if (address.startsWith('0x')) {
    return 'ETH';
  } else if (address.startsWith('T')) {
    return 'TRON';
  } else if (address.startsWith('4')) {
    return 'XMR';
  } else if (address.startsWith('r')) {
    return 'XRP';
  } else if (address.startsWith('L')) {
    return 'LTC';
  } else {
    return 'Unknown';
  }
};

// Calculate risk score based on multiple factors
export const calculateRiskScore = (transaction: TransactionNode): number => {
  let riskScore = 0;
  
  // Start with a base risk of 30 (medium-low)
  riskScore = 30;
  
  // Check for multiple inputs/outputs (indication of mixing)
  if (transaction.children && transaction.children.length > 2) {
    riskScore += 20;
  }
  
  // Check for very small amounts (possibly dusting attacks or test transactions)
  if (transaction.amount < 0.001) {
    riskScore += 10;
  }
  
  // Check for very large amounts (high-value transactions are often more scrutinized)
  if (transaction.amount > 10) {
    riskScore += 15;
  }
  
  // Check for connections to known high-risk addresses
  const knownRiskyAddressParts = ['mixer', 'dark', 'anon', 'swap'];
  if (knownRiskyAddressParts.some(part => transaction.address.toLowerCase().includes(part))) {
    riskScore += 25;
  }
  
  // Cap the risk score at 100
  return Math.min(riskScore, 100);
};

// Identify potential mixing services in the transaction flow
export const identifyMixers = (transactionNodes: TransactionNode[]): string[] => {
  const potentialMixers: string[] = [];
  
  const processNode = (node: TransactionNode) => {
    // Mixers typically have multiple inputs and outputs
    if (node.children && node.children.length > 1 && node.riskScore > 50) {
      potentialMixers.push(node.address);
    }
    
    // Process children recursively
    if (node.children) {
      node.children.forEach(processNode);
    }
  };
  
  transactionNodes.forEach(processNode);
  
  // Return unique mixers
  return [...new Set(potentialMixers)];
};

// Identify end receivers in the transaction flow
export const identifyEndReceivers = (transactionNodes: TransactionNode[]): string[] => {
  const endReceivers: string[] = [];
  
  const findLeafNodes = (node: TransactionNode) => {
    if (!node.children || node.children.length === 0) {
      endReceivers.push(node.address);
    } else {
      node.children.forEach(findLeafNodes);
    }
  };
  
  transactionNodes.forEach(findLeafNodes);
  
  // Return unique end receivers
  return [...new Set(endReceivers)];
};

// Full transaction flow analysis
export const analyzeTransactionFlow = (
  address: string,
  mockTransactions: Transaction[]
): AnalysisResult => {
  const cryptoType = identifyCryptoType(address);
  
  // In a real app, this would fetch real blockchain data
  // For demo, we'll create a transaction flow based on mock data
  
  // Find transactions related to this address
  const relevantTransactions = mockTransactions.filter(
    tx => tx.from === address || tx.to === address
  );
  
  if (relevantTransactions.length === 0) {
    // No transactions found, return empty result
    return {
      transactionNodes: [],
      mixers: [],
      endReceivers: [],
      cryptoType
    };
  }
  
  // Build transaction tree (simplified for demo)
  // In a real app, this would involve much more complex blockchain traversal
  const rootNode: TransactionNode = {
    id: `node-${Date.now()}`,
    address: address,
    amount: relevantTransactions.reduce((sum, tx) => sum + tx.amount, 0),
    currency: cryptoType,
    timestamp: new Date().toISOString(),
    riskScore: 30, // Base risk score for the address
    children: []
  };
  
  // Simple 2-level tree for demo
  // Map outgoing transactions as first level children
  const outgoingTransactions = relevantTransactions.filter(tx => tx.from === address);
  
  // Detect anomalies using ML
  const anomalyIndices = detectAnomalies(relevantTransactions);
  
  // For each outgoing transaction, create a node
  outgoingTransactions.forEach((tx, index) => {
    const childNode: TransactionNode = {
      id: `node-${Date.now()}-${index}`,
      address: tx.to,
      amount: tx.amount,
      currency: cryptoType,
      timestamp: tx.timestamp,
      riskScore: calculateRiskScore({
        id: `temp-${index}`,
        address: tx.to,
        amount: tx.amount,
        currency: cryptoType,
        timestamp: tx.timestamp,
        riskScore: 0 // Placeholder, will be calculated
      }),
      children: []
    };
    
    // Find second-level transactions (where first-level recipients send to others)
    const secondLevelTxs = mockTransactions.filter(stx => stx.from === tx.to);
    
    // Add second-level transactions as children
    childNode.children = secondLevelTxs.map((stx, idx) => {
      const secondLevelNode: TransactionNode = {
        id: `node-${Date.now()}-${index}-${idx}`,
        address: stx.to,
        amount: stx.amount,
        currency: cryptoType,
        timestamp: stx.timestamp,
        riskScore: calculateRiskScore({
          id: `temp-${index}-${idx}`,
          address: stx.to,
          amount: stx.amount,
          currency: cryptoType,
          timestamp: stx.timestamp,
          riskScore: 0 // Placeholder, will be calculated
        }),
        children: []
      };
      
      return secondLevelNode;
    });
    
    rootNode.children?.push(childNode);
  });
  
  // Collect all transaction nodes in a flat array for analysis
  const allNodes: TransactionNode[] = [rootNode];
  
  // Find mixers and end receivers
  const mixers = identifyMixers([rootNode]);
  const endReceivers = identifyEndReceivers([rootNode]);
  
  return {
    transactionNodes: [rootNode],
    mixers,
    endReceivers,
    cryptoType,
    anomalies: anomalyIndices
  };
};

export const analyzeAddress = (address: string, mockTransactions: Transaction[]): { cryptoType: string } => {
  return {
    cryptoType: identifyCryptoType(address)
  };
};

// Enhanced export data to CSV format
export const exportTransactionData = (transactionNodes: TransactionNode[]): string => {
  let csvContent = "Type,Address,Amount,Currency,RiskScore,Suspicious,Timestamp,IsEndReceiver,IsMixer\n";
  
  // Collect all end receivers and mixers
  const endReceivers = new Set<string>();
  const mixers = new Set<string>();
  
  const findEndReceiversAndMixers = (node: TransactionNode) => {
    if (!node.children || node.children.length === 0) {
      endReceivers.add(node.address);
    }
    
    if (node.children && node.children.length > 2 && node.riskScore > 50) {
      mixers.add(node.address);
    }
    
    if (node.children) {
      node.children.forEach(findEndReceiversAndMixers);
    }
  };
  
  transactionNodes.forEach(findEndReceiversAndMixers);
  
  // Process all nodes
  const processNode = (node: TransactionNode) => {
    const isSuspicious = node.riskScore > 50 ? 'Yes' : 'No';
    const isEndReceiver = endReceivers.has(node.address) ? 'Yes' : 'No';
    const isMixer = mixers.has(node.address) ? 'Yes' : 'No';
    
    csvContent += `address,${node.address},${node.amount},${node.currency},${node.riskScore},${isSuspicious},${node.timestamp},${isEndReceiver},${isMixer}\n`;
    
    if (node.children) {
      node.children.forEach(processNode);
    }
  };
  
  transactionNodes.forEach(processNode);
  
  return csvContent;
};

// Convert raw Etherscan transactions to CSV
export const transactionsToCSV = (transactions: any[], cryptoType: string): string => {
  // First, identify anomalies using ML
  const anomalyIndices = detectAnomalies(transactions);
  const anomalySet = new Set(anomalyIndices);
  
  let csvContent = "Date,Transaction Hash,From,To,Value,Status,Gas Used,Gas Price,Block,ML_Anomaly\n";
  
  transactions.forEach((tx, index) => {
    const date = new Date(parseInt(tx.timeStamp) * 1000).toISOString();
    const value = parseFloat(tx.value) / 1e18; // Convert Wei to Ether
    const status = tx.isError === "0" ? "Success" : "Failed";
    const gasUsed = tx.gasUsed || "0";
    const gasPrice = tx.gasPrice ? (parseFloat(tx.gasPrice) / 1e9).toFixed(2) + " Gwei" : "0";
    const isAnomaly = anomalySet.has(index) ? "Yes" : "No";
    
    csvContent += `${date},${tx.hash},${tx.from},${tx.to},${value.toFixed(6)} ${cryptoType},${status},${gasUsed},${gasPrice},${tx.blockNumber},${isAnomaly}\n`;
  });
  
  return csvContent;
};

// Get detailed end receiver info with ML risk enhancement
export const getEndReceiverDetails = (
  transactions: any[], 
  endReceivers: string[]
): { 
  address: string; 
  totalReceived: number; 
  transactionCount: number;
  firstSeen: string;
  lastSeen: string;
  mlRiskScore?: number;
  riskFactors?: string[];
}[] => {
  const endReceiverMap = new Map<string, {
    totalReceived: number;
    transactionCount: number;
    firstSeen: string;
    lastSeen: string;
    relatedTransactions: any[];
  }>();
  
  // Initialize map with all end receivers
  endReceivers.forEach(address => {
    endReceiverMap.set(address, {
      totalReceived: 0,
      transactionCount: 0,
      firstSeen: '',
      lastSeen: '',
      relatedTransactions: []
    });
  });
  
  // Process transactions
  transactions.forEach(tx => {
    if (endReceivers.includes(tx.to)) {
      const receiver = endReceiverMap.get(tx.to);
      if (receiver) {
        const valueInEth = parseFloat(tx.value) / 1e18;
        const timestamp = new Date(parseInt(tx.timeStamp) * 1000).toISOString();
        
        receiver.totalReceived += valueInEth;
        receiver.transactionCount++;
        receiver.relatedTransactions.push(tx);
        
        if (!receiver.firstSeen || timestamp < receiver.firstSeen) {
          receiver.firstSeen = timestamp;
        }
        
        if (!receiver.lastSeen || timestamp > receiver.lastSeen) {
          receiver.lastSeen = timestamp;
        }
        
        endReceiverMap.set(tx.to, receiver);
      }
    }
  });
  
  // Calculate ML risk scores for each end receiver
  return Array.from(endReceiverMap.entries()).map(([address, details]) => {
    // Only calculate ML risk if we have enough transactions
    let mlRiskScore;
    let riskFactors;
    
    if (details.relatedTransactions.length >= 3) {
      const enhancedRisk = calculateEnhancedRiskScore(details.relatedTransactions);
      mlRiskScore = enhancedRisk.riskScore;
      riskFactors = enhancedRisk.factors;
    }
    
    return {
      address,
      totalReceived: details.totalReceived,
      transactionCount: details.transactionCount,
      firstSeen: details.firstSeen,
      lastSeen: details.lastSeen,
      mlRiskScore,
      riskFactors
    };
  });
};

// Calculate ML-enhanced risk score for a complete address
export const getMlEnhancedRiskScore = (transactions: any[]): {
  score: number;
  factors: string[];
} => {
  if (!transactions || transactions.length < 3) {
    return {
      score: 30, // Default baseline score
      factors: ["Insufficient transaction data for ML analysis"]
    };
  }
  
  const result = calculateEnhancedRiskScore(transactions);
  // Convert riskScore to score to match the expected type
  return {
    score: result.riskScore,
    factors: result.factors
  };
};
