
import React, { useState } from 'react';
import { Search, Bitcoin, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface SearchBarProps {
  onSearch: (query: string, type: 'address' | 'transaction') => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'address' | 'transaction'>('address');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast({
        title: "Search query is empty",
        description: "Please enter a wallet address or transaction hash",
        variant: "destructive",
      });
      return;
    }

    onSearch(query, searchType);
    
    // In a real application, you'd validate the input before searching
    toast({
      title: `Searching for ${searchType}`,
      description: query,
    });
  };

  return (
    <div className="w-full mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-muted-foreground">
            <Search className="w-5 h-5" />
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchType === 'address' 
              ? "Enter wallet address (e.g., 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa)" 
              : "Enter transaction hash (e.g., 6a9013b8684862e9...)"}
            className="search-input pl-12 pr-32 py-4 text-base h-auto"
          />
          
          <div className="absolute right-3 flex items-center">
            <div className="flex items-center bg-secondary rounded-full overflow-hidden p-1 mr-2">
              <button
                type="button"
                onClick={() => setSearchType('address')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  searchType === 'address' 
                    ? 'bg-primary text-white' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Address
              </button>
              <button
                type="button"
                onClick={() => setSearchType('transaction')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  searchType === 'transaction' 
                    ? 'bg-primary text-white' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Transaction
              </button>
            </div>
            
            <button
              type="submit"
              className="bg-primary text-white p-2 rounded-full hover:bg-primary/90 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      <div className="flex items-center mt-2 text-xs text-muted-foreground">
        <Bitcoin className="w-3 h-3 mr-1" />
        <span>Supported: BTC, ETH, USDT, XMR</span>
      </div>
    </div>
  );
};

export default SearchBar;
