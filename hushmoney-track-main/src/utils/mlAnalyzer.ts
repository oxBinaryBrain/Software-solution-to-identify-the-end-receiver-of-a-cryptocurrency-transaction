
/**
 * Machine Learning utilities for blockchain transaction analysis
 * Based on algorithms like Isolation Forest for anomaly detection
 */

import { Transaction } from './mockData';

// Helper function to convert transactions to feature vectors
export const transactionsToFeatures = (transactions: any[]): number[][] => {
  if (!transactions || transactions.length === 0) return [];
  
  return transactions.map(tx => {
    const valueInEth = parseFloat(tx.value) / 1e18;
    const gasPrice = parseFloat(tx.gasPrice) / 1e9;
    const timestamp = parseInt(tx.timeStamp);
    
    return [
      valueInEth,
      gasPrice,
      timestamp,
      tx.isError === "1" ? 1 : 0,
      parseInt(tx.gasUsed),
    ];
  });
};

// Isolation Forest algorithm implementation for anomaly detection
// This is a simplified version inspired by the Python sklearn implementation
export class IsolationForest {
  private trees: any[] = [];
  private samples: number = 100;
  private subSamples: number = 256;
  private maxDepth: number = 100;
  
  constructor(
    samples: number = 100, 
    subSamples: number = 256, 
    maxDepth: number = 100
  ) {
    this.samples = samples;
    this.subSamples = subSamples;
    this.maxDepth = maxDepth;
  }
  
  // Create a random tree structure
  private createTree(X: number[][], currentDepth: number, limit: number): any {
    const n_samples = X.length;
    
    if (currentDepth >= limit || n_samples <= 1) {
      return { isLeaf: true, depth: currentDepth, size: n_samples };
    }
    
    // Randomly select a feature
    const featureIdx = Math.floor(Math.random() * X[0].length);
    
    // Find min/max values for the feature
    let minValue = Infinity;
    let maxValue = -Infinity;
    
    for (const sample of X) {
      minValue = Math.min(minValue, sample[featureIdx]);
      maxValue = Math.max(maxValue, sample[featureIdx]);
    }
    
    // If all values are the same, return leaf
    if (minValue === maxValue) {
      return { isLeaf: true, depth: currentDepth, size: n_samples };
    }
    
    // Choose random split value
    const splitValue = minValue + Math.random() * (maxValue - minValue);
    
    // Split the data
    const leftIndices: number[] = [];
    const rightIndices: number[] = [];
    
    for (let i = 0; i < X.length; i++) {
      if (X[i][featureIdx] < splitValue) {
        leftIndices.push(i);
      } else {
        rightIndices.push(i);
      }
    }
    
    // Create sub-arrays
    const leftX = leftIndices.map(i => X[i]);
    const rightX = rightIndices.map(i => X[i]);
    
    // Create tree node
    return {
      isLeaf: false,
      depth: currentDepth,
      size: n_samples,
      featureIdx,
      splitValue,
      left: this.createTree(leftX, currentDepth + 1, limit),
      right: this.createTree(rightX, currentDepth + 1, limit)
    };
  }
  
  // Calculate path length for a single sample in a tree
  private pathLength(sample: number[], tree: any): number {
    if (tree.isLeaf) {
      return tree.depth;
    }
    
    if (sample[tree.featureIdx] < tree.splitValue) {
      return this.pathLength(sample, tree.left);
    } else {
      return this.pathLength(sample, tree.right);
    }
  }
  
  // Fit the model to training data
  fit(X: number[][]): void {
    const n_samples = Math.min(this.samples, X.length);
    
    // Create multiple trees
    this.trees = [];
    for (let i = 0; i < 100; i++) {
      // Randomly select subsamples
      const indices = new Array(X.length).fill(0).map((_, i) => i);
      // Shuffle and take first subSamples
      for (let j = indices.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [indices[j], indices[k]] = [indices[k], indices[j]];
      }
      
      const subIndices = indices.slice(0, this.subSamples);
      const subX = subIndices.map(idx => X[idx]);
      
      // Create and store tree
      const tree = this.createTree(subX, 0, this.maxDepth);
      this.trees.push(tree);
    }
  }
  
  // Predict anomaly scores - higher means more anomalous
  predict(X: number[][]): number[] {
    if (this.trees.length === 0) {
      throw new Error("Model not fitted");
    }
    
    // For each sample, calculate mean path length across all trees
    return X.map(sample => {
      let totalPathLength = 0;
      
      for (const tree of this.trees) {
        totalPathLength += this.pathLength(sample, tree);
      }
      
      const avgPathLength = totalPathLength / this.trees.length;
      
      // Convert path length to anomaly score (0 to 1)
      // Higher score means more anomalous
      const maxDepth = this.maxDepth;
      // Normalize and invert so higher = more anomalous
      return 1 - (avgPathLength / maxDepth);
    });
  }
}

// Detect anomalies in transaction data
export const detectAnomalies = (transactions: any[], threshold: number = 0.7): number[] => {
  if (!transactions || transactions.length < 10) {
    // Not enough data for meaningful analysis
    return [];
  }
  
  // Convert transactions to features
  const features = transactionsToFeatures(transactions);
  
  // Create and train isolation forest
  const isolationForest = new IsolationForest(100, Math.min(256, features.length), 100);
  isolationForest.fit(features);
  
  // Get anomaly scores
  const scores = isolationForest.predict(features);
  
  // Return indices of anomalous transactions
  return scores
    .map((score, index) => ({ score, index }))
    .filter(item => item.score > threshold)
    .map(item => item.index);
};

// Analyze transaction patterns for clustering similar transactions
export const analyzeTransactionPatterns = (transactions: any[]): {
  patternGroups: { [key: string]: number[] },
  anomalies: number[]
} => {
  // Detect anomalies first
  const anomalies = detectAnomalies(transactions);
  
  // Simple pattern grouping (in a real-world scenario, this would use k-means or DBSCAN)
  const patternGroups: { [key: string]: number[] } = {
    highValue: [],
    frequentSmall: [],
    failed: [],
    normal: []
  };
  
  transactions.forEach((tx, index) => {
    const valueInEth = parseFloat(tx.value) / 1e18;
    
    if (valueInEth > 10) {
      patternGroups.highValue.push(index);
    } else if (tx.isError === "1") {
      patternGroups.failed.push(index);
    } else if (valueInEth < 0.01) {
      patternGroups.frequentSmall.push(index);
    } else {
      patternGroups.normal.push(index);
    }
  });
  
  return { patternGroups, anomalies };
};

// Generate ML insights about transaction data
export const generateMlInsights = (transactions: any[]): {
  insights: string[],
  anomalyIndices: number[],
  patterns: { [key: string]: number[] }
} => {
  const insights: string[] = [];
  
  if (!transactions || transactions.length < 5) {
    insights.push("Not enough transaction data for meaningful ML analysis.");
    return { insights, anomalyIndices: [], patterns: {} };
  }
  
  // Detect anomalies
  const anomalyIndices = detectAnomalies(transactions);
  
  if (anomalyIndices.length > 0) {
    insights.push(`Detected ${anomalyIndices.length} potentially anomalous transactions.`);
    
    // Analyze the specific anomalies
    const highValueAnomalies = anomalyIndices.filter(idx => {
      const tx = transactions[idx];
      const valueInEth = parseFloat(tx.value) / 1e18;
      return valueInEth > 5;
    });
    
    if (highValueAnomalies.length > 0) {
      insights.push(`${highValueAnomalies.length} anomalies involve high-value transfers.`);
    }
  } else {
    insights.push("No significant anomalies detected in transaction pattern.");
  }
  
  // Analyze patterns
  const { patternGroups } = analyzeTransactionPatterns(transactions);
  
  // Generate insights based on patterns
  const highValuePercent = (patternGroups.highValue.length / transactions.length) * 100;
  if (highValuePercent > 20) {
    insights.push(`Unusual number of high-value transactions (${highValuePercent.toFixed(1)}%).`);
  }
  
  const failedPercent = (patternGroups.failed.length / transactions.length) * 100;
  if (failedPercent > 5) {
    insights.push(`Higher than normal failed transaction rate (${failedPercent.toFixed(1)}%).`);
  }
  
  // Time-based analysis
  const timestamps = transactions.map(tx => parseInt(tx.timeStamp));
  const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
  
  // Look for rapid succession transactions
  const timeDiffs: number[] = [];
  for (let i = 1; i < sortedTimestamps.length; i++) {
    timeDiffs.push(sortedTimestamps[i] - sortedTimestamps[i-1]);
  }
  
  const rapidTransactions = timeDiffs.filter(diff => diff < 60).length; // Transactions less than 60 seconds apart
  if (rapidTransactions > 3 && (rapidTransactions / timeDiffs.length) > 0.2) {
    insights.push("Pattern of rapid successive transactions detected, which may indicate automated activity.");
  }
  
  return { 
    insights, 
    anomalyIndices,
    patterns: patternGroups
  };
};

// Enhances risk score calculation using ML techniques
export const calculateEnhancedRiskScore = (transactions: any[]): {
  riskScore: number, 
  factors: string[]
} => {
  let baseRiskScore = 30; // Start with a moderate baseline
  const riskFactors: string[] = [];
  
  if (!transactions || transactions.length === 0) {
    return { riskScore: baseRiskScore, factors: ["Insufficient data"] };
  }
  
  // Detect anomalies
  const anomalyIndices = detectAnomalies(transactions);
  const anomalyPercentage = (anomalyIndices.length / transactions.length) * 100;
  
  if (anomalyPercentage > 10) {
    baseRiskScore += 25;
    riskFactors.push("High percentage of anomalous transactions");
  } else if (anomalyIndices.length > 0) {
    baseRiskScore += 15;
    riskFactors.push("Some anomalous transactions detected");
  }
  
  // Check for high-value transactions
  const highValueTxs = transactions.filter(tx => parseFloat(tx.value) / 1e18 > 10);
  if (highValueTxs.length > 3) {
    baseRiskScore += 10;
    riskFactors.push("Multiple high-value transactions");
  }
  
  // Check for failed transactions
  const failedTxs = transactions.filter(tx => tx.isError === "1");
  if (failedTxs.length > transactions.length * 0.1) {
    baseRiskScore += 15;
    riskFactors.push("Elevated rate of failed transactions");
  }
  
  // Time-pattern analysis
  const timestamps = transactions.map(tx => parseInt(tx.timeStamp));
  if (timestamps.length > 5) {
    const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
    const timeDiffs: number[] = [];
    
    for (let i = 1; i < sortedTimestamps.length; i++) {
      timeDiffs.push(sortedTimestamps[i] - sortedTimestamps[i-1]);
    }
    
    // Check for transactions in rapid succession
    const rapidTxs = timeDiffs.filter(diff => diff < 60).length;
    if (rapidTxs > 3) {
      baseRiskScore += 20;
      riskFactors.push("Pattern of rapid successive transactions");
    }
    
    // Check for periodic patterns (potential automated behavior)
    const stdDeviation = calculateStandardDeviation(timeDiffs);
    const mean = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
    const variationCoeff = stdDeviation / mean;
    
    if (variationCoeff < 0.5 && timeDiffs.length > 5) {
      baseRiskScore += 15;
      riskFactors.push("Suspiciously regular transaction intervals");
    }
  }
  
  // Cap at 100
  return { 
    riskScore: Math.min(Math.round(baseRiskScore), 100),
    factors: riskFactors
  };
};

// Helper function to calculate standard deviation
function calculateStandardDeviation(values: number[]): number {
  const n = values.length;
  if (n === 0) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  
  return Math.sqrt(variance);
}
