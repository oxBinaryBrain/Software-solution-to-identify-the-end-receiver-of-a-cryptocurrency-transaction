
export interface Transaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  amount: number;
  currency: string;
  timestamp: string;
  confirmations: number;
  fee: number;
  riskScore: number;
}

export interface Address {
  address: string;
  label?: string;
  balance: number;
  transactions: number;
  firstSeen: string;
  lastSeen: string;
  riskScore: number;
  tags: string[];
}

export interface TransactionFlow {
  id: string;
  sourceAddress: string;
  transactions: TransactionNode[];
}

export interface TransactionNode {
  id: string;
  address: string;
  amount: number;
  currency: string;
  timestamp: string;
  children?: TransactionNode[];
  riskScore: number;
}

// Sample addresses
export const mockAddresses: Address[] = [
  {
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    label: "Satoshi Wallet",
    balance: 68.97,
    transactions: 342,
    firstSeen: "2009-01-03T18:15:05Z",
    lastSeen: "2023-09-15T10:24:32Z",
    riskScore: 12,
    tags: ["Historic", "Exchange"]
  },
  {
    address: "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
    balance: 243.54,
    transactions: 89,
    firstSeen: "2021-04-12T09:33:17Z",
    lastSeen: "2023-12-01T16:45:22Z",
    riskScore: 58,
    tags: ["Mixer", "Suspicious"]
  },
  {
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    label: "Exchange Hot Wallet",
    balance: 1243.87,
    transactions: 4328,
    firstSeen: "2020-02-21T14:22:05Z",
    lastSeen: "2023-12-10T08:11:45Z",
    riskScore: 22,
    tags: ["Exchange", "High Volume"]
  },
  {
    address: "bc1q7nd5e8e32lgpcxmdmmdy2x0tjgwe53a8pl3xnq",
    balance: 5.43,
    transactions: 27,
    firstSeen: "2022-08-17T22:15:41Z",
    lastSeen: "2023-11-29T12:56:33Z",
    riskScore: 87,
    tags: ["Darknet", "Suspicious"]
  },
  {
    address: "bc1qdxe5nha0wxcr794wmk6m0xqr92mdgfzcgpzp6p",
    balance: 0.12,
    transactions: 9,
    firstSeen: "2023-01-08T04:11:28Z",
    lastSeen: "2023-10-14T19:33:10Z",
    riskScore: 92,
    tags: ["Ransomware", "Darknet"]
  }
];

// Sample transactions
export const mockTransactions: Transaction[] = [
  {
    id: "tx1",
    hash: "6a9013b8684862e9ccfb527bf8f5ea5eb213e77e3970ff2cd8bbc22beb7cdb94",
    from: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    to: "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
    amount: 0.58,
    currency: "BTC",
    timestamp: "2023-12-01T16:45:22Z",
    confirmations: 142,
    fee: 0.00012,
    riskScore: 35
  },
  {
    id: "tx2",
    hash: "4a01bf61e7aee8b78d8adb8ab7e8a1da83455c95fc8dcfae191b859d43524f9a",
    from: "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
    to: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    amount: 0.32,
    currency: "BTC",
    timestamp: "2023-12-05T10:22:47Z",
    confirmations: 89,
    fee: 0.00008,
    riskScore: 42
  },
  {
    id: "tx3",
    hash: "8d30eb0f3e65b8d8a9f26a9214a9f9fff2f22e88e07acf51ea3b12c3a7bfdfe2",
    from: "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
    to: "bc1q7nd5e8e32lgpcxmdmmdy2x0tjgwe53a8pl3xnq",
    amount: 0.15,
    currency: "BTC",
    timestamp: "2023-11-29T12:56:33Z",
    confirmations: 210,
    fee: 0.00015,
    riskScore: 78
  },
  {
    id: "tx4",
    hash: "3a2d6a2df0c6ace185de68d4a72836589acaa5c4e4a5a39c7fa593ef8f4e2032",
    from: "bc1q7nd5e8e32lgpcxmdmmdy2x0tjgwe53a8pl3xnq",
    to: "bc1qdxe5nha0wxcr794wmk6m0xqr92mdgfzcgpzp6p",
    amount: 0.12,
    currency: "BTC",
    timestamp: "2023-10-14T19:33:10Z",
    confirmations: 854,
    fee: 0.00022,
    riskScore: 95
  }
];

// Sample transaction flow
export const mockTransactionFlow: TransactionFlow = {
  id: "flow1",
  sourceAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  transactions: [
    {
      id: "node1",
      address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      amount: 0.58,
      currency: "BTC",
      timestamp: "2023-12-01T16:45:22Z",
      riskScore: 12,
      children: [
        {
          id: "node2",
          address: "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
          amount: 0.58,
          currency: "BTC",
          timestamp: "2023-12-01T16:45:22Z",
          riskScore: 58,
          children: [
            {
              id: "node3",
              address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
              amount: 0.32,
              currency: "BTC",
              timestamp: "2023-12-05T10:22:47Z",
              riskScore: 22,
              children: []
            },
            {
              id: "node4",
              address: "bc1q7nd5e8e32lgpcxmdmmdy2x0tjgwe53a8pl3xnq",
              amount: 0.15,
              currency: "BTC",
              timestamp: "2023-11-29T12:56:33Z",
              riskScore: 87,
              children: [
                {
                  id: "node5",
                  address: "bc1qdxe5nha0wxcr794wmk6m0xqr92mdgfzcgpzp6p",
                  amount: 0.12,
                  currency: "BTC",
                  timestamp: "2023-10-14T19:33:10Z",
                  riskScore: 92,
                  children: []
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// Helper function to get risk level from score
export const getRiskLevel = (score: number): 'low' | 'medium' | 'high' => {
  if (score < 30) return 'low';
  if (score < 70) return 'medium';
  return 'high';
};

// Helper function to format address for display
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
};

// Helper function to format date
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
