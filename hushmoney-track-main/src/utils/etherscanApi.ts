
import { TransactionNode } from './mockData';

// Etherscan API Key
const ETHERSCAN_API_KEY = "I8NSUCWSU6SZV31SARU9HEJZ1X6ZQUBDC1";

// API base URLs for different networks
const API_URLS = {
  eth: "https://api.etherscan.io/api",
  // Add more networks as needed
};

interface EtherscanTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  confirmations: string;
}

// Function to fetch transactions for an address
export const fetchTransactions = async (address: string, blockchain = 'eth', limit = 50) => {
  try {
    const apiUrl = API_URLS[blockchain as keyof typeof API_URLS];
    if (!apiUrl) {
      console.error(`Unsupported blockchain: ${blockchain}`);
      return null;
    }

    const url = `${apiUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${ETHERSCAN_API_KEY}`;
    
    console.log(`Fetching transactions from: ${apiUrl} for address: ${address}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error fetching transactions: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== "1") {
      console.error("API error or no transactions found:", data.message);
      return [];
    }
    
    // Return all transactions (or up to the specified limit)
    return limit > 0 ? data.result.slice(0, limit) : data.result;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
};

// Function to fetch all transactions for CSV export
export const fetchAllTransactions = async (address: string, blockchain = 'eth', maxLimit = 2000) => {
  try {
    return await fetchTransactions(address, blockchain, maxLimit);
  } catch (error) {
    console.error("Error fetching all transactions:", error);
    return [];
  }
};

// Convert Wei to Ether
export const weiToEther = (wei: string): number => {
  return parseFloat(wei) / 1e18;
};

// Calculate risk score based on transaction properties
export const calculateTransactionRisk = (tx: EtherscanTransaction): number => {
  let riskScore = 30; // Base risk score
  
  // Large value transactions
  const valueInEth = weiToEther(tx.value);
  if (valueInEth > 10) riskScore += 10;
  if (valueInEth > 100) riskScore += 15;
  
  // Contract interactions (complex transactions)
  if (tx.input && tx.input.length > 10) riskScore += 5;
  
  // Gas price analysis (high gas could indicate urgency)
  const gasPriceGwei = parseFloat(tx.gasPrice) / 1e9;
  if (gasPriceGwei > 100) riskScore += 5;
  
  // Error transactions are suspicious
  if (tx.isError === "1") riskScore += 25;
  
  // Cap at 100
  return Math.min(riskScore, 100);
};

// Build transaction graph from Etherscan API data
export const buildTransactionGraph = async (
  address: string, 
  blockchain = 'eth', 
  depth = 2
): Promise<{
  transactionNodes: TransactionNode[];
  mixers: string[];
  endReceivers: string[];
  transactions: EtherscanTransaction[];
}> => {
  console.log(`Building transaction graph for address: ${address}, depth: ${depth}`);
  
  // Set to keep track of processed addresses
  const processedAddresses = new Set<string>();
  // Map to store nodes by address
  const nodeMap = new Map<string, TransactionNode>();
  // Track all transactions for export
  const allTransactions: EtherscanTransaction[] = [];
  
  // Tracker for connections (to avoid duplicates)
  const connections = new Set<string>();
  
  // Initialize the root node
  const rootNode: TransactionNode = {
    id: `node-root-${address.substring(0, 8)}`,
    address: address,
    amount: 0,
    currency: 'ETH',
    timestamp: new Date().toISOString(),
    riskScore: 30, // Base risk score
    children: []
  };
  
  nodeMap.set(address.toLowerCase(), rootNode);
  
  // Recursive function to process addresses at different depths
  const processAddress = async (currentAddress: string, currentDepth: number, parentNode: TransactionNode | null = null) => {
    if (processedAddresses.has(currentAddress.toLowerCase()) || currentDepth > depth) {
      return;
    }
    
    // Mark address as processed to avoid cycles
    processedAddresses.add(currentAddress.toLowerCase());
    console.log(`Processing address: ${currentAddress} (Depth: ${currentDepth})`);
    
    // Fetch transactions for this address
    const transactions = await fetchTransactions(currentAddress, blockchain);
    
    if (!transactions || transactions.length === 0) {
      return;
    }
    
    // Add to the collection of all transactions
    allTransactions.push(...transactions);
    
    // Get or create the node for this address
    let node = nodeMap.get(currentAddress.toLowerCase());
    if (!node) {
      node = {
        id: `node-${Date.now()}-${currentAddress.substring(0, 8)}`,
        address: currentAddress,
        amount: 0,
        currency: 'ETH',
        timestamp: new Date().toISOString(),
        riskScore: 30, // Base risk score
        children: []
      };
      nodeMap.set(currentAddress.toLowerCase(), node);
    }
    
    // Connect parent and child (if this isn't the root node)
    if (parentNode && !connections.has(`${parentNode.address.toLowerCase()}-${currentAddress.toLowerCase()}`)) {
      // Only add if not already a child
      if (!parentNode.children?.some(child => child.address.toLowerCase() === currentAddress.toLowerCase())) {
        parentNode.children = parentNode.children || [];
        parentNode.children.push(node);
        connections.add(`${parentNode.address.toLowerCase()}-${currentAddress.toLowerCase()}`);
      }
    }
    
    // Only process outgoing transactions for expanding the graph
    if (currentDepth < depth) {
      for (const tx of transactions) {
        // Process outgoing transactions
        if (tx.from.toLowerCase() === currentAddress.toLowerCase()) {
          const toAddress = tx.to;
          const valueInEth = weiToEther(tx.value);
          const txTimestamp = new Date(parseInt(tx.timeStamp) * 1000).toISOString();
          
          // Skip transactions with zero value
          if (valueInEth === 0) continue;
          
          // Get or create the child node
          let childNode = nodeMap.get(toAddress.toLowerCase());
          if (!childNode) {
            const childId = `node-${Date.now()}-${toAddress.substring(0, 8)}`;
            const riskScore = calculateTransactionRisk(tx);
            
            childNode = {
              id: childId,
              address: toAddress,
              amount: valueInEth,
              currency: 'ETH',
              timestamp: txTimestamp,
              riskScore: riskScore,
              children: []
            };
            nodeMap.set(toAddress.toLowerCase(), childNode);
          } else {
            // Update the node with the latest transaction info
            childNode.amount += valueInEth;
            childNode.timestamp = txTimestamp;
            // Update risk score if needed
            const txRisk = calculateTransactionRisk(tx);
            childNode.riskScore = Math.max(childNode.riskScore, txRisk);
          }
          
          // Add child to current node's children if not already there
          if (!connections.has(`${currentAddress.toLowerCase()}-${toAddress.toLowerCase()}`)) {
            node.children = node.children || [];
            
            // Only add if not already a child
            if (!node.children.some(child => child.address.toLowerCase() === toAddress.toLowerCase())) {
              node.children.push(childNode);
              connections.add(`${currentAddress.toLowerCase()}-${toAddress.toLowerCase()}`);
            }
          }
          
          // Process this address recursively in the next depth level
          await processAddress(toAddress, currentDepth + 1, node);
        }
        
        // For the root address, also analyze incoming transactions to see where funds came from
        if (currentDepth === 0 && tx.to.toLowerCase() === currentAddress.toLowerCase()) {
          const fromAddress = tx.from;
          const valueInEth = weiToEther(tx.value);
          const txTimestamp = new Date(parseInt(tx.timeStamp) * 1000).toISOString();
          
          // Skip transactions with zero value
          if (valueInEth === 0) continue;
          
          // Add incoming funds to the root node's amount for completeness
          rootNode.amount += valueInEth;
          
          // We don't need to process incoming transaction senders further in the graph
          // But we can track them for analysis
          if (!nodeMap.has(fromAddress.toLowerCase())) {
            const riskScore = calculateTransactionRisk(tx);
            nodeMap.set(fromAddress.toLowerCase(), {
              id: `node-incoming-${Date.now()}-${fromAddress.substring(0, 8)}`,
              address: fromAddress,
              amount: valueInEth,
              currency: 'ETH',
              timestamp: txTimestamp,
              riskScore: riskScore,
              children: []
            });
          }
        }
      }
    }
  };
  
  // Start processing from the root address
  await processAddress(address, 0);
  
  // Get the root node
  const finalRootNode = nodeMap.get(address.toLowerCase());
  
  // If no root node was created, return empty result
  if (!finalRootNode) {
    return {
      transactionNodes: [],
      mixers: [],
      endReceivers: [],
      transactions: []
    };
  }
  
  // Identify potential mixers (addresses with multiple inputs/outputs)
  const mixers = Array.from(nodeMap.values())
    .filter(node => {
      if (!node.children) return false;
      // A mixer has multiple outputs and a risk score > 50
      return node.children.length > 2 && node.riskScore > 50;
    })
    .map(node => node.address);
  
  // Identify end receivers (leaf nodes)
  const endReceivers = Array.from(nodeMap.values())
    .filter(node => !node.children || node.children.length === 0)
    .map(node => node.address);
  
  return {
    transactionNodes: [finalRootNode],
    mixers,
    endReceivers,
    transactions: allTransactions
  };
};
