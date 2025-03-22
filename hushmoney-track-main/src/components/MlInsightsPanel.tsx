
import React from 'react';
import { AlertTriangle, TrendingUp, BarChart4, Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMlInsights } from '@/utils/mlAnalyzer';
import { formatAddress } from '@/utils/mockData';

interface MlInsightsPanelProps {
  transactions: any[];
  className?: string;
}

const MlInsightsPanel: React.FC<MlInsightsPanelProps> = ({ transactions, className }) => {
  if (!transactions || transactions.length < 5) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            ML Insights
          </CardTitle>
          <CardDescription>
            Not enough transaction data for ML analysis
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  const { insights, anomalyIndices, patterns } = generateMlInsights(transactions);
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          ML-Powered Transaction Insights
        </CardTitle>
        <CardDescription>
          Anomaly detection using Isolation Forest algorithm
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-primary" />
                Key Insights
              </h4>
              <ul className="space-y-1 text-sm">
                {insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No significant patterns detected.</p>
          )}
          
          {anomalyIndices.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1.5 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                Anomalous Transactions
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {anomalyIndices.slice(0, 4).map(idx => {
                  const tx = transactions[idx];
                  const valueInEth = parseFloat(tx.value) / 1e18;
                  const date = new Date(parseInt(tx.timeStamp) * 1000);
                  
                  return (
                    <div key={idx} className="p-2 bg-amber-50 border border-amber-100 rounded-md text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">From: {formatAddress(tx.from)}</span>
                        <span>{date.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>To: {formatAddress(tx.to)}</span>
                        <span className="font-medium">{valueInEth.toFixed(4)} ETH</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {anomalyIndices.length > 4 && (
                <p className="text-xs text-muted-foreground text-right">
                  +{anomalyIndices.length - 4} more anomalies detected
                </p>
              )}
            </div>
          )}
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1.5">
              <BarChart4 className="h-4 w-4 text-primary" />
              Transaction Patterns
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-2 bg-background border rounded-md text-center">
                <div className="text-lg font-medium">{patterns.highValue?.length || 0}</div>
                <div className="text-xs text-muted-foreground">High Value</div>
              </div>
              <div className="p-2 bg-background border rounded-md text-center">
                <div className="text-lg font-medium">{patterns.frequentSmall?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Small Transfers</div>
              </div>
              <div className="p-2 bg-background border rounded-md text-center">
                <div className="text-lg font-medium">{patterns.failed?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Failed Txs</div>
              </div>
              <div className="p-2 bg-background border rounded-md text-center">
                <div className="text-lg font-medium">{patterns.normal?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Normal Txs</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MlInsightsPanel;
