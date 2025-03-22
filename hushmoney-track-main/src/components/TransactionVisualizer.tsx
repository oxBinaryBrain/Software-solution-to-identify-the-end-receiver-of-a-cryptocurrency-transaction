
import React, { useRef, useEffect, useState } from 'react';
import { TransactionNode, getRiskLevel, formatAddress } from '@/utils/mockData';
import RiskIndicator from './RiskIndicator';
import { toast } from '@/components/ui/use-toast';
import { ArrowRight, ExternalLink, AlertTriangle, Loader2, Target, Info, Calendar, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportTransactionData, getMlEnhancedRiskScore } from '@/utils/blockchainAnalyzer';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { weiToEther } from '@/utils/etherscanApi';
import MlInsightsPanel from './MlInsightsPanel';

interface TransactionVisualizerProps {
  transactionNodes: TransactionNode[];
  onNodeSelect?: (nodeAddress: string) => void;
  potentialMixers?: string[];
  endReceivers?: string[];
  isAnalyzing?: boolean;
  recentTransactions?: any[];
}

interface NodeDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  node: TransactionNode | null;
  recentTransactions: any[];
}

const NodeDetailsDialog: React.FC<NodeDetailsDialogProps> = ({ 
  isOpen, 
  onClose, 
  node, 
  recentTransactions 
}) => {
  const [mlRiskScore, setMlRiskScore] = useState<{score: number, factors: string[]} | null>(null);

  useEffect(() => {
    if (node && recentTransactions && recentTransactions.length > 0) {
      // Filter transactions for this node
      const nodeTransactions = recentTransactions.filter(
        tx => tx.from.toLowerCase() === node.address.toLowerCase() || 
             tx.to.toLowerCase() === node.address.toLowerCase()
      );
      
      if (nodeTransactions.length >= 3) {
        const enhancedRisk = getMlEnhancedRiskScore(nodeTransactions);
        setMlRiskScore(enhancedRisk);
      } else {
        setMlRiskScore(null);
      }
    } else {
      setMlRiskScore(null);
    }
  }, [node, recentTransactions]);

  if (!node) return null;
  
  // Filter transactions related to this address
  const addressTransactions = recentTransactions.filter(
    tx => tx.from.toLowerCase() === node.address.toLowerCase() || 
          tx.to.toLowerCase() === node.address.toLowerCase()
  ).slice(0, 10); // Show the 10 most recent
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Info className="w-5 h-5 mr-2 text-primary" />
            Address Details
          </DialogTitle>
          <DialogDescription>
            Detailed information for address {formatAddress(node.address)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Address</p>
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono">{node.address}</code>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => window.open(`https://etherscan.io/address/${node.address}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Risk Assessment</p>
              <div className="flex items-center">
                {mlRiskScore ? (
                  <RiskIndicator 
                    score={mlRiskScore.score} 
                    size="sm"
                    mlFactors={mlRiskScore.factors}
                    showTooltip
                  />
                ) : (
                  <RiskIndicator score={node.riskScore} size="sm" />
                )}
                <div className="ml-2 flex items-center">
                  <span>{getRiskLevel(mlRiskScore?.score || node.riskScore)} Risk</span>
                  {mlRiskScore && (
                    <div className="ml-1 inline-flex items-center text-xs bg-primary/10 text-primary px-1 py-0.5 rounded">
                      <Brain className="w-3 h-3 mr-0.5" />
                      ML Enhanced
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Amount</p>
              <div className="flex items-center">
                <span className="text-lg font-medium">{node.amount.toFixed(4)} {node.currency}</span>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Last Seen</p>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>{new Date(node.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          {mlRiskScore && mlRiskScore.factors.length > 0 && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
              <h4 className="text-sm font-medium mb-1 text-blue-600 flex items-center">
                <Brain className="w-4 h-4 mr-1" />
                ML Risk Factors
              </h4>
              <ul className="text-sm text-blue-600 list-disc pl-5 space-y-1">
                {mlRiskScore.factors.map((factor, idx) => (
                  <li key={idx}>{factor}</li>
                ))}
              </ul>
            </div>
          )}
          
          <Separator />
          
          <div>
            <h4 className="text-sm font-medium mb-3">Recent Transactions</h4>
            {addressTransactions.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>From/To</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {addressTransactions.map((tx, index) => {
                      const isIncoming = tx.to.toLowerCase() === node.address.toLowerCase();
                      const valueInEth = weiToEther(tx.value);
                      const date = new Date(parseInt(tx.timeStamp) * 1000);
                      
                      return (
                        <TableRow key={index} className={valueInEth > 10 ? "bg-amber-50" : ""}>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${isIncoming ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                              {isIncoming ? "Received" : "Sent"}
                            </span>
                          </TableCell>
                          <TableCell>{date.toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {isIncoming ? formatAddress(tx.from) : formatAddress(tx.to)}
                          </TableCell>
                          <TableCell>{valueInEth.toFixed(4)} ETH</TableCell>
                          <TableCell>
                            {tx.isError === "0" ? (
                              <span className="text-green-600 text-xs">Success</span>
                            ) : (
                              <span className="text-red-600 text-xs">Failed</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No recent transactions found for this address.
              </div>
            )}
          </div>
          
          {node.riskScore > 60 && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <h4 className="text-sm font-medium mb-1 text-red-600 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                High Risk Warning
              </h4>
              <p className="text-sm text-red-600">
                This address has been flagged as high risk due to suspicious transaction patterns or known associations with questionable activities.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const RecentTransactionsPanel: React.FC<{ transactions: any[] }> = ({ transactions }) => {
  if (!transactions || transactions.length === 0) return null;
  
  const recentTxs = transactions.slice(0, 5); // Show 5 most recent
  
  return (
    <div className="mb-4 p-3 rounded-lg bg-muted/50">
      <h4 className="font-medium mb-2">Recent Transactions</h4>
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentTxs.map((tx, index) => {
              const valueInEth = weiToEther(tx.value);
              const date = new Date(parseInt(tx.timeStamp) * 1000);
              const isSuspicious = valueInEth > 10 || tx.isError === "1";
              
              return (
                <TableRow key={index} className={isSuspicious ? "bg-amber-50" : ""}>
                  <TableCell>{date.toLocaleDateString()}</TableCell>
                  <TableCell className="font-mono text-xs">{formatAddress(tx.from)}</TableCell>
                  <TableCell className="font-mono text-xs">{formatAddress(tx.to)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {valueInEth.toFixed(4)} ETH
                      {isSuspicious && (
                        <AlertTriangle className="w-3 h-3 ml-1 text-amber-500" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const TransactionVisualizer: React.FC<TransactionVisualizerProps> = ({ 
  transactionNodes,
  onNodeSelect,
  potentialMixers: initialMixers = [],
  endReceivers: initialReceivers = [],
  isAnalyzing = false,
  recentTransactions = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [analyzing, setAnalyzing] = useState(isAnalyzing);
  const [potentialMixers, setPotentialMixers] = useState<string[]>(initialMixers);
  const [endReceivers, setEndReceivers] = useState<string[]>(initialReceivers);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedNode, setSelectedNode] = useState<TransactionNode | null>(null);
  const [showNodeDetails, setShowNodeDetails] = useState(false);
  const [showMlInsights, setShowMlInsights] = useState(false);

  useEffect(() => {
    setPotentialMixers(initialMixers);
    setEndReceivers(initialReceivers);
    setAnalyzing(isAnalyzing);
  }, [initialMixers, initialReceivers, isAnalyzing]);

  const toggleExpand = (nodeId: string) => {
    setExpanded(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const handleNodeDetails = (node: TransactionNode) => {
    setSelectedNode(node);
    setShowNodeDetails(true);
    
    if (onNodeSelect) {
      onNodeSelect(node.address);
    }
  };

  const analyzeTransactionFlow = () => {
    setAnalyzing(true);
    
    // Process using our analysis functions
    setTimeout(() => {
      // Display our existing mixers and receivers
      toast({
        title: "Analysis Complete",
        description: `Found ${potentialMixers.length} potential mixing services and ${endReceivers.length} end receivers.`,
      });
      setAnalyzing(false);
      
      // After analysis, show ML insights
      setShowMlInsights(true);
    }, 1000);
  };

  const exportGraphData = () => {
    // Generate CSV data from transaction nodes
    const csvContent = exportTransactionData(transactionNodes);
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'transaction_analysis.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: "Transaction graph data exported to CSV file.",
    });
  };

  const openEtherscan = (address: string) => {
    window.open(`https://etherscan.io/address/${address}`, '_blank');
  };

  const renderNode = (node: TransactionNode, level: number = 0, isLastChild: boolean = true) => {
    const hasChildren = node.children && node.children.length > 0;
    const riskLevel = getRiskLevel(node.riskScore);
    const isExpanded = expanded[node.id] !== false; // Default to expanded
    const isMixer = potentialMixers.includes(node.address);
    const isEndReceiver = endReceivers.includes(node.address);
    
    // Highlight suspicious nodes 
    const isSuspicious = node.riskScore > 70;
    
    return (
      <div key={node.id} className="relative mt-4" style={{ marginLeft: `${level * 40}px` }}>
        <div className={`crypto-node ${hasChildren ? 'mb-2' : 'mb-2'} relative`}>
          {level > 0 && (
            <div className="absolute -left-8 top-1/2 transform -translate-y-1/2">
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          
          <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 -translate-x-full">
            <div className={`w-2 h-2 rounded-full bg-risk-${riskLevel}`}></div>
          </div>
          
          <div className={`flex justify-between mb-2 p-3 rounded-lg border ${
            isSuspicious 
              ? 'bg-risk-high/5 border-risk-high/30' 
              : isMixer 
                ? 'bg-amber-50 border-amber-300/50' 
                : isEndReceiver 
                  ? 'bg-emerald-50 border-emerald-300/50' 
                  : 'bg-background/80 border-muted'
          }`}>
            <div>
              <div className="flex items-center">
                <p className="text-sm font-medium">{formatAddress(node.address)}</p>
                {isMixer && (
                  <span className="ml-2 flex items-center text-amber-500 text-xs font-medium">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Mixer
                  </span>
                )}
                {isEndReceiver && (
                  <span className="ml-2 flex items-center text-emerald-500 text-xs font-medium">
                    <Target className="w-3 h-3 mr-1" /> End Receiver
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(node.timestamp).toLocaleDateString()}
              </p>
            </div>
            <RiskIndicator score={node.riskScore} size="sm" />
          </div>
          
          <div className="flex justify-between items-center bg-background/60 p-2 rounded-lg border border-muted mt-1">
            <div className="text-sm">
              <span className="font-medium">{node.amount.toFixed(4)}</span>
              <span className="text-muted-foreground ml-1">{node.currency}</span>
            </div>
            
            <div className="flex gap-2">
              {hasChildren && (
                <button 
                  className="text-xs text-secondary-foreground bg-secondary px-2 py-1 rounded"
                  onClick={() => toggleExpand(node.id)}
                >
                  {isExpanded ? 'Collapse' : 'Expand'}
                </button>
              )}
              <button 
                className="text-xs text-primary px-2 py-1 rounded border border-primary/30"
                onClick={() => handleNodeDetails(node)}
              >
                Details
              </button>
              <button 
                className="text-xs text-secondary px-2 py-1 rounded border border-secondary/30"
                onClick={() => openEtherscan(node.address)}
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="relative pl-6 border-l border-dashed border-border/60 mt-2">
            {node.children!.map((child, idx) => 
              renderNode(child, level + 1, idx === node.children!.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  // Don't render if there are no nodes to show
  if (transactionNodes.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-5 animate-scale-in text-center py-12">
        <h3 className="text-lg font-medium mb-2">No Transaction Data</h3>
        <p className="text-muted-foreground">
          Enter a wallet address or transaction hash in the search bar to analyze transaction flow.
        </p>
      </div>
    );
  }

  // Show loading state while analyzing
  if (analyzing) {
    return (
      <div className="glass-panel rounded-xl p-5 animate-scale-in text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <h3 className="text-lg font-medium mb-2">Analyzing Transaction Flow</h3>
        <p className="text-muted-foreground">
          Please wait while we analyze the blockchain data...
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-5 animate-scale-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Transaction Flow</h3>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportGraphData}
            disabled={analyzing}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Export Data
          </Button>
          
          <Button 
            variant="default" 
            size="sm"
            onClick={analyzeTransactionFlow}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-1" />
                ML Analysis
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Recent Transactions Panel */}
      {recentTransactions.length > 0 && (
        <RecentTransactionsPanel transactions={recentTransactions} />
      )}
      
      {/* ML Insights Panel */}
      {showMlInsights && recentTransactions.length > 0 && (
        <MlInsightsPanel 
          transactions={recentTransactions}
          className="mb-4"
        />
      )}
      
      {(potentialMixers.length > 0 || endReceivers.length > 0) && (
        <div className="mb-4 p-3 rounded-lg bg-muted/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {potentialMixers.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <h4 className="font-medium">Potential Mixing Services ({potentialMixers.length})</h4>
                </div>
                <ul className="text-xs space-y-1">
                  {potentialMixers.slice(0, 3).map((address, idx) => (
                    <li key={idx} className="font-mono">{formatAddress(address)}</li>
                  ))}
                  {potentialMixers.length > 3 && (
                    <li className="text-muted-foreground">
                      +{potentialMixers.length - 3} more...
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            {endReceivers.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-emerald-500 mb-2">
                  <Target className="w-4 h-4" />
                  <h4 className="font-medium">End Receivers ({endReceivers.length})</h4>
                </div>
                <ul className="text-xs space-y-1">
                  {endReceivers.slice(0, 3).map((address, idx) => (
                    <li key={idx} className="font-mono">{formatAddress(address)}</li>
                  ))}
                  {endReceivers.length > 3 && (
                    <li className="text-muted-foreground">
                      +{endReceivers.length - 3} more...
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className="transaction-flow-container overflow-x-auto bg-gradient-to-br from-background/50 to-background/80 p-4 rounded-lg border border-muted/50" 
        style={{ maxHeight: '500px' }}
      >
        {transactionNodes.map(node => renderNode(node))}
      </div>
      
      {/* Node Details Dialog */}
      <NodeDetailsDialog 
        isOpen={showNodeDetails} 
        onClose={() => setShowNodeDetails(false)} 
        node={selectedNode}
        recentTransactions={recentTransactions}
      />
    </div>
  );
};

export default TransactionVisualizer;
