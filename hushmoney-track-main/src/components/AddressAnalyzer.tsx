
import React, { useEffect, useState } from 'react';
import { Calendar, ArrowUpRight, Tag, Info } from 'lucide-react';
import { Address, formatDate } from '@/utils/mockData';
import RiskIndicator from './RiskIndicator';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { fetchTransactions } from '@/utils/etherscanApi';
import TransactionModal from './TransactionModal';
import AnalysisReportModal from './AnalysisReportModal';

interface AddressAnalyzerProps {
  address: Address;
  onTraceFunds?: (address: Address) => void;
  cryptoType?: string;
  mixers?: string[];
  endReceivers?: string[];
  transactionCount?: number;
}

const AddressAnalyzer: React.FC<AddressAnalyzerProps> = ({ 
  address, 
  onTraceFunds,
  cryptoType = 'ETH',
  mixers = [],
  endReceivers = [],
  transactionCount = 0
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showAnalysisReport, setShowAnalysisReport] = useState(false);

  useEffect(() => {
    // Fetch balance from Etherscan if address is ETH
    const fetchBalance = async () => {
      if (cryptoType === 'ETH') {
        setIsLoading(true);
        try {
          const response = await fetch(
            `https://api.etherscan.io/api?module=account&action=balance&address=${address.address}&tag=latest&apikey=I8NSUCWSU6SZV31SARU9HEJZ1X6ZQUBDC1`
          );
          const data = await response.json();
          
          if (data.status === '1') {
            // Convert wei to ETH
            const balanceInEth = parseFloat(data.result) / 1e18;
            setBalance(balanceInEth);
          }
        } catch (error) {
          console.error("Error fetching balance:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchBalance();
  }, [address.address, cryptoType]);

  const handleAnalysisReport = async () => {
    toast({
      title: "Analysis Report",
      description: `Generating detailed risk report for address ${address.address.substring(0, 10)}...`,
    });
    
    setShowAnalysisReport(true);
  };
  
  const handleTraceFunds = async () => {
    if (onTraceFunds) {
      onTraceFunds(address);
    } else {
      toast({
        title: "Trace Funds",
        description: `Tracing fund flow for address ${address.address.substring(0, 10)}...`,
      });
    }

    // Fetch transactions
    setIsLoading(true);
    try {
      const txData = await fetchTransactions(address.address, cryptoType.toLowerCase());
      setTransactions(txData || []);
      setShowTransactionModal(true);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions. Please try again.",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };
  
  const handleViewOnExplorer = () => {
    if (cryptoType === 'ETH') {
      window.open(`https://etherscan.io/address/${address.address}`, '_blank');
    } else if (cryptoType === 'BTC') {
      window.open(`https://www.blockchain.com/explorer/addresses/btc/${address.address}`, '_blank');
    } else {
      toast({
        title: "Explorer Not Available",
        description: `No explorer configured for ${cryptoType}`,
      });
    }
  };
  
  return (
    <div className="glass-panel rounded-xl p-5 animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center">
            <h3 className="text-lg font-medium">
              {address.label ? address.label : 'Wallet Address'}
            </h3>
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary/10 rounded-full">
              {cryptoType}
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-mono">{address.address}</p>
        </div>
        <RiskIndicator score={address.riskScore} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground mb-1">Balance</p>
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2">
              {cryptoType === 'BTC' ? '₿' : 
               cryptoType === 'ETH' ? 'Ξ' : 
               cryptoType === 'XMR' ? 'ɱ' : '$'}
            </div>
            <span className="text-lg font-medium">
              {isLoading ? 'Loading...' : 
               balance !== null ? `${balance.toFixed(4)}` : 
               address.balance} {cryptoType}
            </span>
          </div>
        </div>
        
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground mb-1">Transactions</p>
          <div className="flex items-center">
            <ArrowUpRight className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="text-lg font-medium">{address.transactions} transactions</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground mb-1">First Seen</p>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
            <span>{formatDate(address.firstSeen)}</span>
          </div>
        </div>
        
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground mb-1">Last Seen</p>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
            <span>{formatDate(address.lastSeen)}</span>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">Tags</p>
        <div className="flex flex-wrap gap-2">
          {address.tags && address.tags.map((tag, index) => (
            <span 
              key={index}
              className={`px-3 py-1 rounded-full text-xs font-medium bg-secondary flex items-center ${
                tag.toLowerCase().includes('darknet') || 
                tag.toLowerCase().includes('suspicious') || 
                tag.toLowerCase().includes('ransomware') 
                  ? 'bg-risk-high/10 text-risk-high' 
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      <Separator className="my-4" />
      
      <div className="flex justify-between gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleViewOnExplorer}
          className="flex-1"
        >
          <ArrowUpRight className="w-4 h-4 mr-2" />
          <span>View on Explorer</span>
        </Button>
        
        <Button 
          variant="secondary" 
          size="sm"
          onClick={handleAnalysisReport}
          className="flex-1"
          disabled={isLoading}
        >
          <Info className="w-4 h-4 mr-2" />
          <span>Analysis Report</span>
        </Button>
        
        <Button 
          onClick={handleTraceFunds}
          size="sm"
          className="flex-1"
          disabled={isLoading}
        >
          Trace Funds
        </Button>
      </div>

      {/* Transaction Modal */}
      {transactions.length > 0 && (
        <TransactionModal 
          isOpen={showTransactionModal} 
          onClose={() => setShowTransactionModal(false)}
          transactions={transactions}
          cryptoType={cryptoType}
        />
      )}

      {/* Analysis Report Modal */}
      <AnalysisReportModal
        isOpen={showAnalysisReport}
        onClose={() => setShowAnalysisReport(false)}
        address={address.address}
        riskScore={address.riskScore}
        cryptoType={cryptoType}
        mixers={mixers}
        endReceivers={endReceivers}
        transactionCount={transactionCount}
      />
    </div>
  );
};

export default AddressAnalyzer;
