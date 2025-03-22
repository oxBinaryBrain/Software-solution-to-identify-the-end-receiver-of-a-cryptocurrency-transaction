
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/mockData';
import { Button } from '@/components/ui/button';
import { ExternalLink, Info, Target, AlertTriangle, Download } from 'lucide-react';
import { weiToEther } from '@/utils/etherscanApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { exportTransactionData } from '@/utils/blockchainAnalyzer';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  isError?: string;
  riskScore?: number;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  cryptoType: string;
  endReceivers?: string[];
  potentialMixers?: string[];
}

const getRiskBadge = (riskScore: number | undefined) => {
  if (!riskScore) return null;
  
  if (riskScore > 70) {
    return <Badge className="bg-risk-high">High Risk</Badge>;
  } else if (riskScore > 40) {
    return <Badge className="bg-risk-medium">Medium Risk</Badge>;
  } else {
    return <Badge className="bg-risk-low">Low Risk</Badge>;
  }
};

const truncateAddress = (address: string) => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  transactions,
  cryptoType,
  endReceivers = [],
  potentialMixers = []
}) => {
  const [activeTab, setActiveTab] = useState("all");
  
  // Calculate risk score based on transaction properties
  const calculateRiskScore = (tx: Transaction): number => {
    let riskScore = 30; // Base risk score
    
    // Large value transactions
    const valueInEth = parseFloat(tx.value) / 1e18;
    if (valueInEth > 10) riskScore += 10;
    if (valueInEth > 100) riskScore += 15;
    
    // Error transactions are suspicious
    if (tx.isError === "1") riskScore += 25;
    
    // Cap at 100
    return Math.min(riskScore, 100);
  };

  // Process transactions to add risk scores if they don't exist
  const processedTransactions = transactions.map(tx => {
    if (tx.riskScore === undefined) {
      return {
        ...tx,
        riskScore: calculateRiskScore(tx)
      };
    }
    return tx;
  });

  // Sort by timestamp descending (newest first)
  const sortedTransactions = [...processedTransactions].sort((a, b) => 
    parseInt(b.timeStamp) - parseInt(a.timeStamp)
  );

  // Filter suspicious transactions (risk score > 50)
  const suspiciousTransactions = sortedTransactions.filter(tx => 
    (tx.riskScore || 0) > 50
  );

  // Filter end receiver transactions
  const endReceiverTransactions = sortedTransactions.filter(tx => 
    endReceivers.includes(tx.to)
  );

  // Filter mixer transactions
  const mixerTransactions = sortedTransactions.filter(tx => 
    potentialMixers.includes(tx.to) || potentialMixers.includes(tx.from)
  );

  // Export full transaction history to CSV
  const handleExportCSV = () => {
    // Use all transactions
    const transactionsForExport = sortedTransactions;
    
    // Generate CSV content
    const csvContent = generateTransactionCSV(transactionsForExport);
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateTransactionCSV = (transactions: Transaction[]): string => {
    let csvContent = "Timestamp,Transaction Hash,From,To,Value (" + cryptoType + "),Risk Score,Suspicious\n";
    
    transactions.forEach(tx => {
      const date = new Date(parseInt(tx.timeStamp) * 1000).toISOString();
      const value = weiToEther(tx.value).toFixed(6);
      const riskScore = tx.riskScore || 30;
      const isSuspicious = riskScore > 50 ? 'Yes' : 'No';
      
      csvContent += `${date},${tx.hash},${tx.from},${tx.to},${value},${riskScore},${isSuspicious}\n`;
    });
    
    return csvContent;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Transaction Analysis</DialogTitle>
          <DialogDescription>
            Analyzing transactions for this wallet address.
            {suspiciousTransactions.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {suspiciousTransactions.length} Suspicious Transactions
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-2 flex justify-end">
          <Button 
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-2"
          >
            <Download className="h-4 w-4" /> 
            Export Full History (CSV)
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="suspicious">Suspicious</TabsTrigger>
            <TabsTrigger value="mixers">Potential Mixers</TabsTrigger>
            <TabsTrigger value="receivers">End Receivers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <h3 className="font-medium mb-2">Recent Transactions</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTransactions.slice(0, 20).map((tx) => {
                  const isSuspicious = (tx.riskScore || 0) > 50;
                  return (
                    <TableRow key={tx.hash} className={isSuspicious ? "bg-red-50/30" : ""}>
                      <TableCell>{formatDate(new Date(parseInt(tx.timeStamp) * 1000).toISOString())}</TableCell>
                      <TableCell className="font-mono text-xs">{tx.hash.substring(0, 10)}...</TableCell>
                      <TableCell className="font-mono text-xs">{truncateAddress(tx.from)}</TableCell>
                      <TableCell className="font-mono text-xs">{truncateAddress(tx.to)}</TableCell>
                      <TableCell>{weiToEther(tx.value).toFixed(4)} {cryptoType}</TableCell>
                      <TableCell>
                        {getRiskBadge(tx.riskScore)}
                        {isSuspicious && (
                          <AlertTriangle className="h-3 w-3 text-risk-high inline ml-1" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`https://etherscan.io/tx/${tx.hash}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="suspicious">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-risk-high" />
              <h3 className="font-medium">Suspicious Transactions</h3>
            </div>
            
            {suspiciousTransactions.length > 0 ? (
              <div className="bg-red-50/10 p-3 rounded-md border border-red-200 mb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Transaction</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suspiciousTransactions.slice(0, 10).map((tx) => (
                      <TableRow key={tx.hash} className="bg-red-50/20 border-l-2 border-risk-high">
                        <TableCell>{formatDate(new Date(parseInt(tx.timeStamp) * 1000).toISOString())}</TableCell>
                        <TableCell className="font-mono text-xs">{tx.hash.substring(0, 10)}...</TableCell>
                        <TableCell className="font-mono text-xs">{truncateAddress(tx.from)}</TableCell>
                        <TableCell className="font-mono text-xs">{truncateAddress(tx.to)}</TableCell>
                        <TableCell>{weiToEther(tx.value).toFixed(4)} {cryptoType}</TableCell>
                        <TableCell>
                          {getRiskBadge(tx.riskScore)}
                          <AlertTriangle className="h-3 w-3 text-risk-high inline ml-1" />
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`https://etherscan.io/tx/${tx.hash}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground mb-4">No suspicious transactions found.</p>
            )}
          </TabsContent>
          
          <TabsContent value="mixers">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-medium">Potential Mixer Transactions</h3>
            </div>
            
            {mixerTransactions.length > 0 ? (
              <div className="bg-amber-50/10 p-3 rounded-md border border-amber-200 mb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Transaction</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mixerTransactions.slice(0, 10).map((tx) => (
                      <TableRow key={tx.hash} className="bg-amber-50/10 border-l-2 border-amber-400">
                        <TableCell>{formatDate(new Date(parseInt(tx.timeStamp) * 1000).toISOString())}</TableCell>
                        <TableCell className="font-mono text-xs">{tx.hash.substring(0, 10)}...</TableCell>
                        <TableCell className="font-mono text-xs">{truncateAddress(tx.from)}</TableCell>
                        <TableCell className="font-mono text-xs">{truncateAddress(tx.to)}</TableCell>
                        <TableCell>{weiToEther(tx.value).toFixed(4)} {cryptoType}</TableCell>
                        <TableCell>{getRiskBadge(tx.riskScore)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`https://etherscan.io/tx/${tx.hash}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground mb-4">No mixer-related transactions found.</p>
            )}
          </TabsContent>
          
          <TabsContent value="receivers">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-emerald-500" />
              <h3 className="font-medium">End Receiver Details</h3>
            </div>
            
            {endReceivers.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-emerald-50/10 p-4 rounded-md border border-emerald-200 mb-4">
                  <h4 className="font-medium mb-2">End Receiver Addresses ({endReceivers.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {endReceivers.slice(0, 6).map((address, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-background border">
                        <span className="font-mono text-xs">{address}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(`https://etherscan.io/address/${address}`, '_blank')}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {endReceivers.length > 6 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      +{endReceivers.length - 6} more end receivers
                    </p>
                  )}
                </div>
                
                <h4 className="font-medium mb-2">Transactions to End Receivers</h4>
                {endReceiverTransactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Transaction</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To (Receiver)</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Risk</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {endReceiverTransactions.slice(0, 10).map((tx) => (
                        <TableRow key={tx.hash} className="bg-emerald-50/5">
                          <TableCell>{formatDate(new Date(parseInt(tx.timeStamp) * 1000).toISOString())}</TableCell>
                          <TableCell className="font-mono text-xs">{tx.hash.substring(0, 10)}...</TableCell>
                          <TableCell className="font-mono text-xs">{truncateAddress(tx.from)}</TableCell>
                          <TableCell className="font-mono text-xs">{truncateAddress(tx.to)}</TableCell>
                          <TableCell>{weiToEther(tx.value).toFixed(4)} {cryptoType}</TableCell>
                          <TableCell>{getRiskBadge(tx.riskScore)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`https://etherscan.io/tx/${tx.hash}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">No transactions to end receivers found.</p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground mb-4">No end receivers identified in this transaction set.</p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionModal;
