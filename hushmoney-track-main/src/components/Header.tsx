
import React, { useState } from 'react';
import { SearchIcon, AlertTriangle, Database, Activity } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface HeaderProps {
  onRecentActivity?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onRecentActivity }) => {
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  const handleRecentActivity = () => {
    if (onRecentActivity) {
      onRecentActivity();
    } else {
      toast({
        title: "Recent Activity",
        description: "Showing the last 5 transactions you've analyzed",
      });
    }
  };

  return (
    <header className="w-full px-6 py-4 flex items-center justify-between glass-panel rounded-xl mb-6 animate-fade-in">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
          <Database className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-medium">CryptoTracer</h1>
          <p className="text-sm text-muted-foreground">Cryptocurrency Transaction Analysis</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center bg-secondary rounded-full px-4 py-1.5">
          <div className="w-2 h-2 rounded-full bg-risk-low mr-2 animate-pulse-light"></div>
          <span className="text-sm font-medium">System Online</span>
        </div>
        
        <button 
          className="btn-secondary flex items-center"
          onClick={handleRecentActivity}
        >
          <Activity className="w-4 h-4 mr-2" />
          <span>Recent Activity</span>
        </button>
        
        <Sheet>
          <SheetTrigger asChild>
            <button className="btn-primary flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              <span>Alerts</span>
            </button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Risk Alerts</SheetTitle>
              <SheetDescription>
                Recent high-risk transactions detected in the network
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="p-3 rounded-lg border border-risk-high/20 bg-risk-high/5">
                <p className="font-medium">Suspicious Transaction</p>
                <p className="text-sm text-muted-foreground">Transaction to known darknet market</p>
                <p className="text-xs mt-2 font-mono">bc1q7nd5e8e32lgpcx...</p>
                <div className="flex justify-end mt-2">
                  <button 
                    className="text-xs text-primary" 
                    onClick={() => {
                      toast({
                        title: "Alert inspected",
                        description: "Analytics dashboard will open in a new window"
                      });
                    }}
                  >
                    Inspect
                  </button>
                </div>
              </div>
              
              <div className="p-3 rounded-lg border border-risk-medium/20 bg-risk-medium/5">
                <p className="font-medium">Mixed Funds</p>
                <p className="text-sm text-muted-foreground">Transaction passed through a mixing service</p>
                <p className="text-xs mt-2 font-mono">3J98t1WpEZ73CNmQvie...</p>
                <div className="flex justify-end mt-2">
                  <button 
                    className="text-xs text-primary"
                    onClick={() => {
                      toast({
                        title: "Alert inspected",
                        description: "Analytics dashboard will open in a new window"
                      });
                    }}
                  >
                    Inspect
                  </button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
