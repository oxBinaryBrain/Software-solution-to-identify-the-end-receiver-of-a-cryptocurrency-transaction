
// Python to JavaScript utility functions for blockchain analysis

// Identify crypto type from wallet address format
export const identifyCryptoType = (address) => {
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

// Calculate risk score based on transaction data
export const calculateRiskScore = (transactions) => {
  if (!transactions || transactions.length === 0) return 30;
  
  let riskScore = 30; // Base risk score
  
  // Check for high-value transactions
  const highValueTxCount = transactions.filter(tx => {
    const value = parseFloat(tx.value) / 1e18;
    return value > 10;
  }).length;
  
  if (highValueTxCount > 0) {
    riskScore += Math.min(25, highValueTxCount * 5);
  }
  
  // Check for failed transactions
  const failedTxCount = transactions.filter(tx => tx.isError === "1").length;
  if (failedTxCount > 0) {
    riskScore += Math.min(20, failedTxCount * 5);
  }
  
  // Check for transaction frequency - many transactions in short time
  if (transactions.length > 20) {
    riskScore += 10;
  }
  
  // Check for connections to known mixer addresses (simplified example)
  const potentialMixerKeywords = ['mixer', 'tumbler', 'swap', 'anon'];
  const hasMixerConnections = transactions.some(tx => 
    potentialMixerKeywords.some(keyword => 
      tx.to.toLowerCase().includes(keyword) || tx.from.toLowerCase().includes(keyword)
    )
  );
  
  if (hasMixerConnections) {
    riskScore += 25;
  }
  
  // Cap at 100
  return Math.min(riskScore, 100);
};

// Identify potential mixer services
export const identifyPotentialMixers = (transactions) => {
  if (!transactions || transactions.length === 0) return [];
  
  // Count frequencies of addresses
  const addressCounts = {};
  transactions.forEach(tx => {
    if (!addressCounts[tx.to]) addressCounts[tx.to] = 0;
    addressCounts[tx.to]++;
  });
  
  // Find addresses with unusually high transaction counts
  const potentialMixers = Object.keys(addressCounts).filter(addr => {
    return addressCounts[addr] > 5; // Addresses with more than 5 incoming txs
  });
  
  // Check for known mixer keywords in addresses
  const mixerKeywords = ['mixer', 'tumbler', 'swap', 'anon', 'tornado', 'cash'];
  const keywordMixers = transactions
    .map(tx => tx.to)
    .filter(addr => 
      mixerKeywords.some(keyword => addr.toLowerCase().includes(keyword))
    );
  
  // Combine both approaches and remove duplicates
  return [...new Set([...potentialMixers, ...keywordMixers])];
};

// Identify end receivers
export const identifyEndReceivers = (transactions) => {
  if (!transactions || transactions.length === 0) return [];
  
  // Get all addresses that received funds
  const receivingAddresses = transactions.map(tx => tx.to);
  
  // Get all addresses that sent funds
  const sendingAddresses = transactions.map(tx => tx.from);
  
  // Find addresses that only received but never sent
  const endReceivers = receivingAddresses.filter(addr => 
    !sendingAddresses.includes(addr)
  );
  
  // Return unique addresses
  return [...new Set(endReceivers)];
};

// Generate comprehensive risk report
export const generateRiskReport = (address, transactions) => {
  const cryptoType = identifyCryptoType(address);
  const riskScore = calculateRiskScore(transactions);
  const potentialMixers = identifyPotentialMixers(transactions);
  const endReceivers = identifyEndReceivers(transactions);
  
  return {
    address,
    cryptoType,
    riskScore,
    potentialMixers,
    endReceivers,
    transactionCount: transactions.length,
    suspiciousTransactions: transactions.filter(tx => {
      const value = parseFloat(tx.value) / 1e18;
      return value > 10 || tx.isError === "1";
    }),
    analysisTimestamp: new Date().toISOString()
  };
};

export default {
  identifyCryptoType,
  calculateRiskScore,
  identifyPotentialMixers,
  identifyEndReceivers,
  generateRiskReport
};
