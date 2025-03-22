
import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldOff, Info } from 'lucide-react';
import { getRiskLevel } from '@/utils/mockData';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

interface RiskIndicatorProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
  mlFactors?: string[];
}

const RiskIndicator: React.FC<RiskIndicatorProps> = ({ 
  score, 
  showLabel = true,
  size = 'md',
  showTooltip = false,
  className,
  mlFactors
}) => {
  const riskLevel = getRiskLevel(score);
  
  const getSizeClass = () => {
    switch(size) {
      case 'sm': return 'w-3 h-3';
      case 'lg': return 'w-6 h-6';
      default: return 'w-4 h-4';
    }
  };
  
  const getTextSize = () => {
    switch(size) {
      case 'sm': return 'text-xs';
      case 'lg': return 'text-base';
      default: return 'text-sm';
    }
  };
  
  const getRiskIcon = () => {
    switch(riskLevel) {
      case 'low': return <Shield className={getSizeClass()} />;
      case 'medium': return <ShieldAlert className={getSizeClass()} />;
      case 'high': return <ShieldOff className={getSizeClass()} />;
    }
  };
  
  const getRiskColor = () => {
    switch(riskLevel) {
      case 'low': return 'text-risk-low bg-risk-low/10';
      case 'medium': return 'text-risk-medium bg-risk-medium/10';
      case 'high': return 'text-risk-high bg-risk-high/10';
    }
  };
  
  const getRiskText = () => {
    switch(riskLevel) {
      case 'low': return 'Low Risk';
      case 'medium': return 'Medium Risk';
      case 'high': return 'High Risk';
    }
  };

  const getRiskDescription = () => {
    if (mlFactors && mlFactors.length > 0) {
      return (
        <div className="space-y-2">
          <p className="font-medium text-sm mb-2">ML-Enhanced Risk Analysis:</p>
          <ul className="list-disc pl-4 space-y-1 text-xs">
            {mlFactors.map((factor, idx) => (
              <li key={idx}>{factor}</li>
            ))}
          </ul>
        </div>
      );
    }
    
    switch(riskLevel) {
      case 'low':
        return 'Lower risk addresses typically have normal transaction patterns, smaller transaction amounts, and no connections to known suspicious services.';
      case 'medium':
        return 'Medium risk addresses may have some unusual patterns such as multiple rapid transfers, connections to addresses with higher risk scores, or moderate anonymity features.';
      case 'high':
        return 'High risk addresses show patterns consistent with suspicious activity, such as connections to mixers/tumblers, very large transaction values, unusual transaction patterns, or connections to known high-risk services.';
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <div className={`inline-flex items-center px-2 py-1 rounded-full ${getRiskColor()}`}>
        {getRiskIcon()}
        {showLabel && (
          <span className={`ml-1 font-medium ${getTextSize()}`}>
            {getRiskText()} ({score})
          </span>
        )}
      </div>
      
      {showTooltip && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="inline-flex">
                <Info className="h-4 w-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              {getRiskDescription()}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default RiskIndicator;
