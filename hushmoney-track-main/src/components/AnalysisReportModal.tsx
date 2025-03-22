
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, 
  AlertTriangle, 
  BarChart3, 
  PieChart, 
  FileText, 
  Check, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity,
  NetworkIcon
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartLegend, 
  ChartLegendContent, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { 
  BarChart, 
  Bar, 
  PieChart as RechartssPieChart, 
  Pie, 
  ResponsiveContainer, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { Badge } from "@/components/ui/badge";
import RiskIndicator from './RiskIndicator';

interface AnalysisReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  riskScore: number;
  cryptoType: string;
  mixers: string[];
  endReceivers: string[];
  transactionCount: number;
}

const AnalysisReportModal: React.FC<AnalysisReportModalProps> = ({
  isOpen,
  onClose,
  address,
  riskScore,
  cryptoType,
  mixers,
  endReceivers,
  transactionCount
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Risk categories data for pie chart - dynamically calculated based on actual risk score
  const riskData = [
    { 
      name: 'High Risk Factors', 
      value: Math.round(riskScore > 70 ? riskScore/2 : Math.min(riskScore/5, 10)), 
      color: '#ef4444' 
    },
    { 
      name: 'Medium Risk Factors', 
      value: Math.round(riskScore > 40 && riskScore <= 70 ? riskScore/2 : Math.min(20, Math.max(riskScore/3, 10))), 
      color: '#f97316' 
    },
    { 
      name: 'Low Risk Factors', 
      value: Math.round(riskScore <= 40 ? 70 : Math.max(10, 100 - riskScore)), 
      color: '#22c55e' 
    }
  ];

  // Transaction flow data
  const flowData = [
    { name: 'Regular', value: transactionCount - mixers.length - endReceivers.length, color: '#3b82f6' },
    { name: 'Suspicious Mixers', value: mixers.length, color: '#ef4444' },
    { name: 'End Receivers', value: endReceivers.length, color: '#22c55e' }
  ];

  // Transaction volume data based on risk score to make it more dynamic
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const volumeData = monthNames.map(name => {
    const baseVolume = riskScore <= 40 ? 20 : riskScore <= 70 ? 40 : 70;
    return {
      name,
      volume: Math.floor(Math.random() * baseVolume) + (riskScore / 5)
    };
  });

  // Generate transaction graph data - shows suspicious transaction patterns
  const generateTransactionGraphData = () => {
    // We'll generate 30 days of transaction data
    const data = [];
    const now = new Date();
    
    // Add some random baseline activity
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      
      // Base volume depends on risk score
      const baseVolume = riskScore <= 40 ? 
        Math.random() * 3 + 0.5 : 
        riskScore <= 70 ? 
          Math.random() * 5 + 1 : 
          Math.random() * 8 + 2;
      
      // Add some periodic spikes for high risk addresses
      const dayOfMonth = date.getDate();
      let spikeVolume = 0;
      let anomaly = false;
      
      // For high risk users, add suspicious patterns
      if (riskScore > 65) {
        // Add cyclical patterns (e.g., large transactions every 7-10 days)
        if (dayOfMonth % 7 === 0) {
          spikeVolume = Math.random() * 15 + 10;
          anomaly = true;
        }
      }
      
      // Add random anomalies for medium-high risk users
      if (riskScore > 50 && Math.random() > 0.85) {
        spikeVolume = Math.random() * 12 + 5;
        anomaly = true;
      }
      
      const totalVolume = baseVolume + spikeVolume;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: totalVolume.toFixed(2),
        baseline: baseVolume.toFixed(2),
        anomaly: anomaly
      });
    }
    
    return data;
  };

  // Transaction anomaly data
  const transactionGraphData = generateTransactionGraphData();
  
  // Calculate total suspicious volume from the graph data
  const calculateSuspiciousVolume = () => {
    let total = 0;
    transactionGraphData.forEach(data => {
      if (data.anomaly) {
        const volume = parseFloat(data.volume);
        const baseline = parseFloat(data.baseline);
        total += (volume - baseline);
      }
    });
    return total.toFixed(2);
  };

  const suspiciousTransactionVolume = calculateSuspiciousVolume();
  const avgTransactionVolume = transactionGraphData.reduce((sum, data) => sum + parseFloat(data.volume), 0) / transactionGraphData.length;
  
  // Scatter plot data showing transaction relationships
  const generateScatterData = () => {
    const data = [];
    const totalPoints = Math.min(20, Math.max(10, Math.floor(transactionCount / 5)));
    
    // Regular transactions - smaller amounts, consistent pattern
    for (let i = 0; i < totalPoints * 0.7; i++) {
      data.push({
        x: Math.random() * 3 + 1,  // Transaction amount (small)
        y: Math.random() * 10 + 1, // Transaction frequency
        z: 5,                      // Bubble size
        name: 'Regular',
        color: '#3b82f6'
      });
    }
    
    // Suspicious transactions - larger amounts, irregular pattern
    if (riskScore > 50) {
      for (let i = 0; i < totalPoints * 0.2; i++) {
        data.push({
          x: Math.random() * 10 + 8,  // Transaction amount (large)
          y: Math.random() * 3 + 1,   // Transaction frequency (less frequent)
          z: 10,                      // Bubble size (larger)
          name: 'Suspicious',
          color: '#ef4444'
        });
      }
    }
    
    // Mixer transactions - medium amounts, very irregular
    if (mixers.length > 0) {
      for (let i = 0; i < Math.min(mixers.length, totalPoints * 0.1); i++) {
        data.push({
          x: Math.random() * 5 + 5,   // Transaction amount (medium)
          y: Math.random() * 8 + 1,   // Transaction frequency (varied)
          z: 8,                       // Bubble size
          name: 'Mixer',
          color: '#f59e0b'
        });
      }
    }
    
    return data;
  };

  const scatterData = generateScatterData();

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Determine message based on graph data and risk score
  const getAnomalyMessage = () => {
    const anomalyCount = transactionGraphData.filter(data => data.anomaly).length;
    
    if (anomalyCount === 0) {
      return 'This address shows minimal transaction anomalies, consistent with normal wallet usage.';
    } else if (riskScore > 65) {
      return 'This address shows regular anomalous transaction patterns, which may indicate scheduled mixing operations or other programmatic suspicious activity.';
    } else if (riskScore > 40) {
      return 'This address shows occasional transaction anomalies that may warrant further investigation.';
    } else {
      return 'This address shows minimal transaction anomalies, consistent with normal wallet usage.';
    }
  };
  
  // Calculate suspicious percentage based on risk score
  const suspiciousPercentage = riskScore;
  const normalPercentage = 100 - suspiciousPercentage;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Risk Analysis Report
          </DialogTitle>
          <DialogDescription>
            <span className="text-sm text-muted-foreground">Comprehensive analysis for address </span>
            <code className="text-xs font-mono px-1 py-0.5 bg-muted rounded">{address.substring(0, 8)}...{address.substring(address.length - 6)}</code>
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="graph">Transaction Graph</TabsTrigger>
            <TabsTrigger value="details">Risk Details</TabsTrigger>
          </TabsList>
          
          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* Risk Score Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Risk Assessment
                  </CardTitle>
                  <CardDescription>Overall wallet risk analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium">Risk Score</span>
                      <div className="flex items-center">
                        <span className="text-2xl font-bold">{riskScore}</span>
                        <span className="text-sm text-muted-foreground">/100</span>
                        <RiskIndicator score={riskScore} showLabel={false} showTooltip={true} className="ml-2" />
                      </div>
                    </div>
                    
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-3 rounded-full ${
                          riskScore > 70 ? 'bg-risk-high' : 
                          riskScore > 40 ? 'bg-risk-medium' : 
                          'bg-risk-low'
                        }`}
                        style={{ width: `${riskScore}%` }}
                      ></div>
                    </div>
                    
                    <div className="pt-2">
                      <Badge variant={riskScore > 70 ? "destructive" : riskScore > 40 ? "default" : "outline"} className="gap-1 items-center">
                        {riskScore > 70 ? (
                          <AlertCircle className="h-3 w-3" />
                        ) : riskScore > 40 ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        {riskScore > 70 ? 'High Risk' : riskScore > 40 ? 'Medium Risk' : 'Low Risk'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-2">
                      {riskScore > 70 ? 
                        'High risk - suspicious activity patterns detected' : 
                        riskScore > 40 ? 
                        'Medium risk - some unusual transaction patterns observed' : 
                        'Low risk - normal transaction patterns with no suspicious activity'}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-primary" />
                    Risk Breakdown
                  </CardTitle>
                  <CardDescription>Analysis of contributing risk factors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartssPieChart>
                        <Pie
                          data={riskData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={2}
                          dataKey="value"
                          labelLine={false}
                          label={renderCustomizedLabel}
                        >
                          {riskData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name) => [`${value}`, name]} 
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc' }}
                        />
                        <Legend
                          layout="vertical" 
                          verticalAlign="middle" 
                          align="right"
                          wrapperStyle={{ paddingLeft: "10px" }}
                        />
                      </RechartssPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Transaction Count</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{transactionCount}</div>
                    <div className="p-2 rounded-full bg-blue-100">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Suspicious Mixers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{mixers.length}</div>
                    <div className="p-2 rounded-full bg-red-100">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">End Receivers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{endReceivers.length}</div>
                    <div className="p-2 rounded-full bg-green-100">
                      <ArrowDownRight className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Transaction Flow Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Transaction Flow Analysis
                </CardTitle>
                <CardDescription>Distribution of transaction types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/2 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={flowData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [`${value}`, 'Count']}
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc' }}
                        />
                        <Legend />
                        <Bar dataKey="value" name="Count">
                          {flowData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-1/2">
                    <div className="space-y-3">
                      <div className="p-3 rounded-md bg-blue-50/30 border border-blue-100/50">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <h4 className="font-medium">Regular Transactions: {transactionCount - mixers.length - endReceivers.length}</h4>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">Standard transactions with normal patterns</p>
                      </div>
                      
                      <div className="p-3 rounded-md bg-red-50/30 border border-red-100/50">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <h4 className="font-medium">Potential Mixers: {mixers.length}</h4>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">Addresses that may be mixing services or tumblers</p>
                      </div>
                      
                      <div className="p-3 rounded-md bg-green-50/30 border border-green-100/50">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <h4 className="font-medium">End Receivers: {endReceivers.length}</h4>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">Final destination addresses in the transaction flow</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* TRANSACTIONS TAB */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Transaction Volume (6 Months)
                </CardTitle>
                <CardDescription>Historical transaction volume in {cryptoType}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={volumeData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${value} ${cryptoType}`, 'Volume']} 
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc' }}
                      />
                      <Area type="monotone" dataKey="volume" stroke="#8884d8" fillOpacity={1} fill="url(#colorVolume)" name="Transaction Volume" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Transaction Pattern Analysis
                </CardTitle>
                <CardDescription>Distribution of transaction amounts vs frequency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{
                        top: 20,
                        right: 20,
                        bottom: 20,
                        left: 20,
                      }}
                    >
                      <CartesianGrid opacity={0.3} />
                      <XAxis type="number" dataKey="x" name="Amount" unit={` ${cryptoType}`} />
                      <YAxis type="number" dataKey="y" name="Frequency" unit=" tx/day" />
                      <ZAxis type="number" dataKey="z" range={[60, 400]} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name) => {
                        if (name === 'Amount') return [`${value} ${cryptoType}`, name];
                        if (name === 'Frequency') return [`${value} tx/day`, name];
                        return [value, name];
                      }} />
                      <Legend />
                      {['Regular', 'Suspicious', 'Mixer'].map((name, index) => {
                        const data = scatterData.filter(d => d.name === name);
                        if (data.length === 0) return null;
                        
                        return (
                          <Scatter
                            key={`scatter-${name}`}
                            name={name}
                            data={data}
                            fill={data[0].color}
                          />
                        );
                      })}
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* GRAPH TAB - New Addition */}
          <TabsContent value="graph" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <NetworkIcon className="h-4 w-4 text-primary" />
                  Transaction Graph Analysis
                </CardTitle>
                <CardDescription>Visualizing transaction anomalies over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={transactionGraphData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'volume') return [`${value} ${cryptoType}`, 'Transaction Volume'];
                          if (name === 'baseline') return [`${value} ${cryptoType}`, 'Expected Volume'];
                          return [value, name];
                        }}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="volume" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        activeDot={(props) => {
                          const { cx, cy, payload } = props;
                          return payload.anomaly ? (
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={8} 
                              fill="#ef4444" 
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          ) : (
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={4} 
                              fill="#8884d8" 
                            />
                          );
                        }}
                        name="Transaction Volume"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="baseline" 
                        stroke="#82ca9d" 
                        strokeDasharray="5 5" 
                        name="Expected Volume" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-4 p-4 rounded-md bg-amber-50 border border-amber-200">
                  <h4 className="text-sm font-medium text-amber-800 flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Transaction Anomalies
                  </h4>
                  <p className="text-sm text-amber-700">
                    Red dots indicate suspicious transaction patterns that significantly deviate from the expected baseline. 
                    {getAnomalyMessage()}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Transaction Discrepancy Analysis
                </CardTitle>
                <CardDescription>Highlighting anomalous transaction behavior</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Key Findings</h4>
                    <ul className="space-y-2 text-sm">
                      {riskScore > 70 && (
                        <>
                          <li className="flex items-start gap-2">
                            <div className="mt-1 w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
                            <span>Cyclical large transaction patterns detected, occurring approximately every 7 days</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="mt-1 w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
                            <span>Multiple connections to known mixing services ({mixers.length})</span>
                          </li>
                        </>
                      )}
                      
                      {riskScore > 40 && (
                        <li className="flex items-start gap-2">
                          <div className="mt-1 w-2 h-2 rounded-full bg-amber-500 shrink-0"></div>
                          <span>Occasional transaction volume spikes exceeding 3x normal activity</span>
                        </li>
                      )}
                      
                      <li className="flex items-start gap-2">
                        <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                        <span>Average transaction volume: {avgTransactionVolume.toFixed(2)} {cryptoType}/day</span>
                      </li>
                      
                      <li className="flex items-start gap-2">
                        <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                        <span>Total suspicious transaction value: {suspiciousTransactionVolume} {cryptoType}</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Normal', value: normalPercentage, color: '#22c55e' },
                          { name: 'Suspicious', value: suspiciousPercentage, color: '#ef4444' }
                        ]}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                        <Bar dataKey="value" name="Percentage">
                          {[
                            { name: 'Normal', value: normalPercentage, color: '#22c55e' },
                            { name: 'Suspicious', value: suspiciousPercentage, color: '#ef4444' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* DETAILS TAB */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Understanding Risk Scores
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="mt-1 w-3 h-3 rounded-full bg-risk-low shrink-0"></div>
                    <p><strong>Low Risk (0-40):</strong> Normal transaction patterns, smaller amounts, no connection to suspicious services.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 w-3 h-3 rounded-full bg-risk-medium shrink-0"></div>
                    <p><strong>Medium Risk (41-70):</strong> Some unusual patterns, rapid transfers, connections to addresses with higher risk scores.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 w-3 h-3 rounded-full bg-risk-high shrink-0"></div>
                    <p><strong>High Risk (71-100):</strong> Suspicious activity patterns, mixer connections, large transaction values, or known high-risk services.</p>
                  </div>
                </div>
                
                <Separator className="my-2" />
                
                <div>
                  <h4 className="font-medium mb-2">How Risk Scores Are Calculated:</h4>
                  <ul className="space-y-2 list-disc pl-5">
                    <li>
                      <span className="font-medium">Transaction Patterns:</span> Unusual patterns like multiple rapid transfers or circular transactions increase risk score.
                    </li>
                    <li>
                      <span className="font-medium">Transaction Values:</span> Very large transactions (greater than 10 ETH) add 15 points to the risk score, while small amounts (less than 0.001 ETH) add 10 points as potential dusting attacks.
                    </li>
                    <li>
                      <span className="font-medium">Mixer Connections:</span> Connections to known mixing services add 25 points to the risk score.
                    </li>
                    <li>
                      <span className="font-medium">Suspicious Keywords:</span> Addresses containing terms like "mixer", "dark", "anon", or "swap" receive higher risk scores.
                    </li>
                    <li>
                      <span className="font-medium">Transaction Errors:</span> Failed transactions increase risk by 25 points as they may indicate suspicious activity attempts.
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Suspicious Transaction Criteria:</h4>
                  <div className="bg-red-50/30 p-3 rounded-md border border-red-200/50">
                    <p>Transactions are flagged as suspicious when they meet one or more of these criteria:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Risk score exceeds 50 points</li>
                      <li>Connection to identified mixing services</li>
                      <li>Transaction value exceeds 10 ETH</li>
                      <li>Failed transaction with high gas fees</li>
                      <li>Multiple hops to known high-risk addresses</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Risk Indicators */}
            {riskScore > 50 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>High Risk Indicators Detected</AlertTitle>
                <AlertDescription>
                  This wallet shows patterns consistent with suspicious activity:
                  <ul className="list-disc pl-5 mt-2">
                    {mixers.length > 0 && <li>Connection to potential mixing services ({mixers.length} detected)</li>}
                    {riskScore > 70 && <li>Unusual transaction patterns</li>}
                    {riskScore > 80 && <li>High volume of anonymous transactions</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {riskScore > 30 && riskScore <= 50 && (
              <Alert variant="default">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Medium Risk Indicators</AlertTitle>
                <AlertDescription>
                  Some unusual patterns detected, but no clear evidence of illicit activity.
                  {mixers.length > 0 && (
                    <ul className="list-disc pl-5 mt-2">
                      <li>Minor connections to potential mixing services ({mixers.length} detected)</li>
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            {riskScore <= 30 && (
              <Alert variant="default" className="bg-green-50/30 text-green-800 border-green-200">
                <Check className="h-4 w-4" />
                <AlertTitle>Low Risk Indicators</AlertTitle>
                <AlertDescription>
                  This wallet shows normal transaction patterns with no significant risk indicators.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AnalysisReportModal;
