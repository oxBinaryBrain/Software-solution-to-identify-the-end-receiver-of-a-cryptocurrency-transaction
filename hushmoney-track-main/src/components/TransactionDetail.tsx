
import React from 'react';
import { ExternalLink, Clock, ArrowRight, Banknote } from 'lucide-react';
import { Transaction, formatDate, formatAddress } from '@/utils/mockData';
import RiskIndicator from './RiskIndicator';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

interface TransactionDetailProps {
  transaction: Transaction;
  onTraceTransaction?: (transaction: Transaction) => void;
}

const TransactionDetail: React.FC<TransactionDetailProps> = ({ 
  transaction,
  onTraceTransaction
}) => {
  const openExplorer = () => {
    // In a real app this would open the actual blockchain explorer
    const explorerUrl = `https://www.blockchain.com/explorer/transactions/btc/${transaction.hash}`;
    window.open(explorerUrl, '_blank');
    toast({
      title: "Opening Explorer",
      description: "Redirecting to blockchain explorer in a new tab",
    });
  };
  
  const handleTraceTransaction = () => {
    if (onTraceTransaction) {
      onTraceTransaction(transaction);
    } else {
      toast({
        title: "Trace Transaction",
        description: `Following money flow for transaction ${transaction.hash.substring(0, 10)}...`,
      });
    }
  };
  
  return (
    <div className="glass-panel rounded-xl p-5 animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Transaction Details</h3>
        <RiskIndicator score={transaction.riskScore} />
      </div>
      
      <div className="space-y-4">
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Transaction Hash</p>
          <div className="flex items-center justify-between">
            <code className="text-sm font-mono">{transaction.hash}</code>
            <button 
              className="text-primary hover:text-primary/80 transition-colors"
              onClick={openExplorer}
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
              <span>{formatDate(transaction.timestamp)}</span>
            </div>
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Confirmations</p>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-risk-low mr-2 text-white text-xs flex items-center justify-center">
                ✓
              </div>
              <span>{transaction.confirmations} confirmations</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
            <div>
              <p className="text-sm text-muted-foreground">From</p>
              <div className="flex items-center mt-1">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center mr-2">
                  <span className="text-xs">F</span>
                </div>
                <span className="font-mono">{transaction.from}</span>
              </div>
            </div>
            
            <div className="mx-auto md:mx-0">
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">To</p>
              <div className="flex items-center mt-1">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center mr-2">
                  <span className="text-xs">T</span>
                </div>
                <span className="font-mono">{transaction.to}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <div className="flex items-center mt-1">
                <Banknote className="w-4 h-4 mr-2 text-primary" />
                <span className="text-lg font-medium">{transaction.amount} {transaction.currency}</span>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Fee</p>
              <span>{transaction.fee} {transaction.currency}</span>
            </div>
          </div>
        </div>
      </div>
      
      <Separator className="my-4" />
      
      <div className="flex justify-between">
        <Button variant="secondary" onClick={openExplorer}>View in Explorer</Button>
        <Button onClick={handleTraceTransaction}>Trace Transaction</Button>
      </div>
    </div>
  );
};

export default TransactionDetail;
