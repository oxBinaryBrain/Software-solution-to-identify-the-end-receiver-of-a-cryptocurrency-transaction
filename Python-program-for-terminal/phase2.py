import networkx as nx
import matplotlib.pyplot as plt
import requests
import logging
import argparse

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Your Etherscan API Key
ETHERSCAN_API_KEY = "I8NSUCWSU6SZV31SARU9HEJZ1X6ZQUBDC1"  # 🔴 REPLACE WITH YOUR OWN API KEY

# Function to fetch transactions
def fetch_transactions(address, blockchain):
    """Fetch transactions from blockchain explorers."""
    api_urls = {
        "eth": f"https://api.etherscan.io/api?module=account&action=txlist&address={address}&startblock=0&endblock=99999999&sort=asc&apikey={ETHERSCAN_API_KEY}"
    }

    if blockchain not in api_urls:
        logging.error(f"Unsupported blockchain: {blockchain}")
        return None

    response = requests.get(api_urls[blockchain])
    if response.status_code != 200:
        logging.error(f"Error fetching transactions: {response.status_code}")
        return None

    data = response.json()
    if data.get("status") != "1":
        logging.error("No transactions found or invalid API response.")
        return None

    return data.get("result", [])

# Build transaction graph
def build_transaction_graph(address, blockchain, depth=2):
    """Construct a transaction graph from a given address."""
    graph = nx.DiGraph()
    addresses_to_process = [(address, 0)]  # (address, depth)
    processed_addresses = set()

    while addresses_to_process:
        current_address, current_depth = addresses_to_process.pop(0)

        if current_address in processed_addresses or current_depth > depth:
            continue

        processed_addresses.add(current_address)
        logging.info(f"Processing address: {current_address} (Depth: {current_depth})")

        transactions = fetch_transactions(current_address, blockchain)
        if not transactions:
            continue

        for tx in transactions:
            tx_hash = tx.get("hash")
            from_addr = tx.get("from")
            to_addr = tx.get("to")
            value = float(tx.get("value", 0)) / 10**18  # Convert Wei to Ether

            if from_addr and to_addr and tx_hash:
                graph.add_node(from_addr, type="address")
                graph.add_node(to_addr, type="address")
                graph.add_node(tx_hash, type="transaction")

                graph.add_edge(from_addr, tx_hash, value=value)
                graph.add_edge(tx_hash, to_addr, value=value)

                # Add new addresses to process if within depth limit
                if to_addr != current_address and current_depth < depth:
                    addresses_to_process.append((to_addr, current_depth + 1))

    return graph

# Identify mixers (services that anonymize transactions)
def identify_mixers(graph):
    """Identify potential mixer services in the transaction graph."""
    potential_mixers = [node for node in graph.nodes() if graph.in_degree(node) > 5 and graph.out_degree(node) > 5]
    return potential_mixers

# Identify potential end receivers
def identify_end_receivers(graph):
    """Find addresses that only receive funds and do not send further."""
    return [node for node in graph.nodes() if graph.in_degree(node) > 0 and graph.out_degree(node) == 0]

# Visualize transaction graph
def visualize_graph(graph, output_file="transaction_graph.png"):
    """Visualize the transaction network."""
    plt.figure(figsize=(12, 10))

    pos = nx.spring_layout(graph)
    address_nodes = [n for n, attrs in graph.nodes(data=True) if attrs.get("type") == "address"]
    tx_nodes = [n for n, attrs in graph.nodes(data=True) if attrs.get("type") == "transaction"]

    nx.draw_networkx_nodes(graph, pos, nodelist=address_nodes, node_color="blue", node_size=200, alpha=0.8)
    nx.draw_networkx_nodes(graph, pos, nodelist=tx_nodes, node_color="green", node_size=100, alpha=0.5)
    nx.draw_networkx_edges(graph, pos, width=0.5, alpha=0.5, arrows=True)

    labels = {node: node[:8] + "..." for node in address_nodes[:10]}  # Show only first few addresses
    nx.draw_networkx_labels(graph, pos, labels=labels, font_size=8)

    plt.title("Cryptocurrency Transaction Network")
    plt.axis("off")
    plt.tight_layout()
    plt.savefig(output_file, dpi=300)
    logging.info(f"Network graph saved to {output_file}")

# Parse command-line arguments
parser = argparse.ArgumentParser(description="Track cryptocurrency transactions.")
parser.add_argument("-t", "--track", help="Wallet address to track", required=True)
parser.add_argument("-b", "--blockchain", help="Blockchain (eth)", required=True)
parser.add_argument("-d", "--depth", help="Depth of transaction tracking (default: 2)", type=int, default=2)
parser.add_argument("-g", "--graph", help="Generate transaction graph", action="store_true")

args = parser.parse_args()

# Track transactions
def track_transactions(address, blockchain, depth=2, generate_graph=False):
    """Main function to track transactions and generate graphs."""
    if generate_graph:
        graph = build_transaction_graph(address, blockchain, depth)
        mixers = identify_mixers(graph)
        receivers = identify_end_receivers(graph)

        logging.info("\n🔍 Transaction Graph Analysis Results:\n" + "="*50)
        logging.info(f"Total nodes: {graph.number_of_nodes()}")
        logging.info(f"Total transactions: {len([n for n, attrs in graph.nodes(data=True) if attrs.get('type') == 'transaction'])}")

        if mixers:
            logging.warning(f"\n⚠️ Potential Mixing Services Detected ({len(mixers)}):\n" + "="*50)
            for mixer in mixers[:5]:  # Show top 5
                logging.warning(f"Address: {mixer}")

        if receivers:
            logging.info(f"\n🎯 Potential End Receivers ({len(receivers)}):\n" + "="*50)
            for receiver in receivers[:10]:  # Show top 10
                logging.info(f"Address: {receiver}")

        # Generate visualization
        visualize_graph(graph)

        # Export data to CSV
        with open(f"{address}_analysis.csv", "w") as f:
            f.write("Type,Address,In_Degree,Out_Degree\n")
            for node, attrs in graph.nodes(data=True):
                if attrs.get("type") == "address":
                    f.write(f"address,{node},{graph.in_degree(node)},{graph.out_degree(node)}\n")

    else:
        transactions = fetch_transactions(address, blockchain)
        logging.info(f"Fetched {len(transactions)} transactions for {address}")

# Execute tracking
if __name__ == "__main__":
    track_transactions(args.track, args.blockchain, args.depth, args.graph)
