
import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import TransactionDetail from '@/components/TransactionDetail';
import AddressAnalyzer from '@/components/AddressAnalyzer';
import TransactionVisualizer from '@/components/TransactionVisualizer';
import TransactionModal from '@/components/TransactionModal';
import AnalysisReportModal from '@/components/AnalysisReportModal';
import { toast } from '@/components/ui/use-toast';
import { 
  mockAddresses, 
  mockTransactions, 
  Address, 
  Transaction,
  TransactionNode
} from '@/utils/mockData';
import { 
  identifyCryptoType,
  calculateRiskScore
} from '@/utils/blockchainAnalyzer';
import { buildTransactionGraph, fetchAllTransactions } from '@/utils/etherscanApi';

const Index = () => {
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionFlow, setShowTransactionFlow] = useState(false);
  const [transactionNodes, setTransactionNodes] = useState<TransactionNode[]>([]);
  const [potentialMixers, setPotentialMixers] = useState<string[]>([]);
  const [endReceivers, setEndReceivers] = useState<string[]>([]);
  const [cryptoType, setCryptoType] = useState<string>('ETH');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transactionCount, setTransactionCount] = useState(0);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [addressTransactions, setAddressTransactions] = useState<any[]>([]);
  const [showAnalysisReportModal, setShowAnalysisReportModal] = useState(false);
  
  // Add ref for scrolling to recent transactions
  const transactionVisualizerRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (query: string, type: 'address' | 'transaction') => {
    if (type === 'address') {
      setIsAnalyzing(true);
      toast({
        title: "Analyzing Wallet",
        description: `Fetching transaction data for ${query}...`,
      });
      
      const detectedCryptoType = identifyCryptoType(query);
      setCryptoType(detectedCryptoType);
      
      try {
        const dummyAddress: Address = {
          address: query,
          balance: 0,
          transactions: 0,
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          riskScore: 30,
          tags: [`${detectedCryptoType} Address`]
        };
        
        setSelectedAddress(dummyAddress);
        
        const rawTransactions = await fetchAllTransactions(query, 'eth', 100);
        setAddressTransactions(rawTransactions || []);
        
        const result = await buildTransactionGraph(query, 'eth', 2);
        
        setTransactionNodes(result.transactionNodes);
        setPotentialMixers(result.mixers);
        setEndReceivers(result.endReceivers);
        
        if (!rawTransactions || rawTransactions.length === 0) {
          setAddressTransactions(result.transactions || []);
        }
        
        let txCount = 0;
        if (result.transactionNodes.length > 0 && result.transactionNodes[0].children) {
          txCount = result.transactionNodes[0].children.length;
        }
        setTransactionCount(txCount);
        
        let dynamicRiskScore = 30;
        
        if (result.mixers.length > 0) {
          dynamicRiskScore += result.mixers.length * 10;
        }
        
        if (txCount > 50) dynamicRiskScore += 15;
        else if (txCount > 20) dynamicRiskScore += 10;
        else if (txCount > 10) dynamicRiskScore += 5;
        
        dynamicRiskScore = Math.min(dynamicRiskScore, 100);
        
        setSelectedAddress({
          ...dummyAddress,
          transactions: txCount,
          riskScore: dynamicRiskScore
        });
        
        toast({
          title: `${detectedCryptoType} Address Analyzed`,
          description: `Found ${txCount} transactions, Risk Score: ${dynamicRiskScore}`,
        });
      } catch (error) {
        console.error("Error analyzing address:", error);
        toast({
          title: "Analysis Error",
          description: "There was an error analyzing this address. Please try again.",
          variant: "destructive"
        });
      }
      
      setIsAnalyzing(false);
      setShowTransactionFlow(true);
    } else {
      const foundTransaction = mockTransactions.find(t => 
        t.hash.toLowerCase().includes(query.toLowerCase())
      );
      
      if (foundTransaction) {
        setSelectedTransaction(foundTransaction);
        
        toast({
          title: "Transaction Found",
          description: `Found transaction of ${foundTransaction.amount} ${foundTransaction.currency}`,
        });
      } else {
        toast({
          title: "Transaction Not Found",
          description: "No matching transaction found in the database",
          variant: "destructive",
        });
      }
    }
  };

  const handleNodeSelect = (nodeAddress: string) => {
    const dummyAddress: Address = {
      address: nodeAddress,
      balance: 0,
      transactions: 0,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      riskScore: 30,
      tags: [`${cryptoType} Address`]
    };
    
    setSelectedAddress(dummyAddress);
    
    toast({
      title: "Node Selected",
      description: `Address ${nodeAddress.substring(0, 10)}... details loaded`,
    });
  };

  const handleTraceFunds = async (address: Address) => {
    setIsAnalyzing(true);
    toast({
      title: "Tracing Funds",
      description: `Analyzing fund flow from address ${address.address.substring(0, 10)}...`,
    });
    
    try {
      const result = await buildTransactionGraph(address.address, 'eth', 2);
      
      setTransactionNodes(result.transactionNodes);
      setPotentialMixers(result.mixers);
      setEndReceivers(result.endReceivers);
      setAddressTransactions(result.transactions || []);
      
      let txCount = 0;
      if (result.transactionNodes.length > 0 && result.transactionNodes[0].children) {
        txCount = result.transactionNodes[0].children.length;
      }
      setTransactionCount(txCount);
      
      let dynamicRiskScore = address.riskScore || 30;
      
      if (result.mixers.length > 0) {
        dynamicRiskScore = Math.min(dynamicRiskScore + result.mixers.length * 8, 100);
      }
      
      setSelectedAddress({
        ...address,
        riskScore: dynamicRiskScore,
        transactions: txCount
      });
      
      setShowTransactionModal(true);
      
      toast({
        title: "Fund Tracing Complete",
        description: `Found ${txCount} transactions, Risk Score: ${dynamicRiskScore}`,
      });
    } catch (error) {
      console.error("Error tracing funds:", error);
      toast({
        title: "Tracing Error",
        description: "There was an error tracing funds for this address.",
        variant: "destructive"
      });
    }
    
    setIsAnalyzing(false);
    setShowTransactionFlow(true);
  };

  const handleTraceTransaction = (transaction: Transaction) => {
    handleTraceFunds({
      address: transaction.from,
      balance: 0,
      transactions: 0,
      firstSeen: transaction.timestamp,
      lastSeen: transaction.timestamp,
      riskScore: transaction.riskScore,
      tags: [`${transaction.currency} Address`]
    });
  };

  const handleShowAnalysisReport = () => {
    if (selectedAddress) {
      setShowAnalysisReportModal(true);
    }
  };
  
  // Add function to scroll to recent transactions
  const scrollToRecentTransactions = () => {
    if (transactionVisualizerRef.current) {
      transactionVisualizerRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      
      toast({
        title: "Recent Transactions",
        description: "Showing latest transaction data",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header onRecentActivity={scrollToRecentTransactions} />
        
        <SearchBar onSearch={handleSearch} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {selectedAddress && (
            <AddressAnalyzer 
              address={selectedAddress} 
              onTraceFunds={handleTraceFunds}
              cryptoType={cryptoType}
              mixers={potentialMixers}
              endReceivers={endReceivers}
              transactionCount={transactionCount}
            />
          )}
          
          {selectedTransaction && (
            <TransactionDetail 
              transaction={selectedTransaction}
              onTraceTransaction={handleTraceTransaction}
            />
          )}
        </div>
        
        {showTransactionFlow && (
          <div ref={transactionVisualizerRef}>
            <TransactionVisualizer 
              transactionNodes={transactionNodes.length > 0 ? transactionNodes : []}
              onNodeSelect={handleNodeSelect}
              potentialMixers={potentialMixers}
              endReceivers={endReceivers}
              isAnalyzing={isAnalyzing}
              recentTransactions={addressTransactions}
            />
          </div>
        )}
        
        <TransactionModal 
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          transactions={addressTransactions}
          cryptoType={cryptoType}
          endReceivers={endReceivers}
          potentialMixers={potentialMixers}
        />
        
        {selectedAddress && (
          <AnalysisReportModal
            isOpen={showAnalysisReportModal}
            onClose={() => setShowAnalysisReportModal(false)}
            address={selectedAddress.address}
            riskScore={selectedAddress.riskScore}
            cryptoType={cryptoType}
            mixers={potentialMixers}
            endReceivers={endReceivers}
            transactionCount={transactionCount}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
