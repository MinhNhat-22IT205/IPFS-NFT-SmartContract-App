# Carbon Footprint DApp

A decentralized application that allows users to mint NFTs by uploading files to IPFS. The project consists of a smart contract (Solidity) and a React frontend with Web3 integration.

## Project Structure

```
carbon-footprint-dapp/
├── smart-contract/          # Hardhat project with Solidity contracts
│   ├── contracts/          # Smart contract source files
│   ├── scripts/            # Deployment scripts
│   └── hardhat.config.cjs  # Hardhat configuration
└── frontend/               # React + Vite frontend
    └── src/                # Frontend source code
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MetaMask** or another Web3 wallet browser extension
- A **Pinata account** (for IPFS storage) - Sign up at [pinata.cloud](https://pinata.cloud)
- A **WalletConnect Project ID** (free at [cloud.walletconnect.com](https://cloud.walletconnect.com))
- **Sepolia testnet ETH** (for deploying contracts and minting NFTs)

## Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd carbon-footprint-dapp
```

### 2. Install Smart Contract Dependencies

```bash
cd smart-contract
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## Configuration

### Smart Contract Configuration

1. **Update Hardhat Config** (`smart-contract/hardhat.config.cjs`):

   - Replace the private key in the `accounts` array with your own wallet private key (for testing only)
   - Update the Infura URL if needed, or use your own RPC endpoint
   - **⚠️ WARNING**: Never commit private keys to version control!

   ```javascript
   module.exports = {
     solidity: "0.8.24",
     networks: {
       sepolia: {
         url: "YOUR_INFURA_OR_RPC_URL",
         accounts: ["YOUR_PRIVATE_KEY"], // Test wallet only!
       },
     },
   };
   ```

### Frontend Configuration

1. **Update Contract Address** (`frontend/src/App.tsx`):

   - After deploying the contract, update the `NFT_SAVE_CONTRACT_ADDRESS` constant with your deployed contract address

2. **Update Pinata JWT** (`frontend/src/App.tsx`):

   - Replace `PINATA_JWT` with your own Pinata JWT token
   - You can get this from your Pinata account dashboard
   - **⚠️ WARNING**: Consider moving this to an environment variable for production

3. **Update WalletConnect Project ID** (`frontend/src/main.tsx`):
   - Replace the `projectId` in `getDefaultConfig` with your own WalletConnect Project ID

## Deployment

### Deploy the Smart Contract

1. **Navigate to the smart contract directory**:

   ```bash
   cd smart-contract
   ```

2. **Compile the contracts**:

   ```bash
   npx hardhat compile
   ```

3. **Deploy to Sepolia testnet**:

   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

4. **Save the deployed contract address**:

   - The deployment script will output the contract address
   - Copy this address and update it in `frontend/src/App.tsx` as `NFT_SAVE_CONTRACT_ADDRESS`

   Example output:

   ```
   Deployed to: 0x1234567890123456789012345678901234567890
   Add this to your frontend → CONTRACT_ADDRESS = 0x1234567890123456789012345678901234567890
   ```

## Running the Frontend

1. **Navigate to the frontend directory**:

   ```bash
   cd frontend
   ```

2. **Start the development server**:

   ```bash
   npm run dev
   ```

3. **Open your browser**:

   - The app will typically be available at `http://localhost:5173`
   - Check the terminal output for the exact URL

4. **Connect your wallet**:
   - Click the "Connect Wallet" button
   - Select your wallet (MetaMask, WalletConnect, etc.)
   - Make sure you're connected to the Sepolia testnet

## Usage

1. **Connect your Web3 wallet** using the Connect Button
2. **Select a file** (image, video, etc.) to mint as an NFT
3. **Click "MINT NFT NGAY"** button
4. The app will:
   - Upload your file to IPFS via Pinata
   - Create metadata JSON with the IPFS link
   - Upload metadata to IPFS
   - Mint an NFT on the Sepolia blockchain with the metadata CID
5. **View your NFT** on OpenSea Testnet using the provided link

## Available Scripts

### Smart Contract

- `npx hardhat compile` - Compile Solidity contracts
- `npx hardhat run scripts/deploy.js --network sepolia` - Deploy to Sepolia
- `npx hardhat node` - Start local Hardhat network

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Smart Contracts

### IPFSNFT.sol

- ERC721 NFT contract
- `mintNFT(string memory _cid)` - Mints an NFT with IPFS CID

### IPFSStorage.sol

- Simple storage contract for IPFS CIDs
- `setCID(string memory _cid)` - Store a CID
- `getCID()` - Retrieve the stored CID

## Tech Stack

### Smart Contract

- **Solidity** ^0.8.24
- **Hardhat** - Development environment
- **OpenZeppelin** - ERC721 implementation

### Frontend

- **React** ^19.2.0
- **TypeScript**
- **Vite** - Build tool
- **Wagmi** - React Hooks for Ethereum
- **RainbowKit** - Wallet connection UI
- **Tailwind CSS** - Styling
- **Pinata** - IPFS pinning service

## Troubleshooting

### Contract Deployment Issues

- **Insufficient funds**: Ensure your wallet has enough Sepolia ETH
- **Network mismatch**: Verify you're connected to Sepolia testnet
- **RPC errors**: Check your Infura URL or RPC endpoint

### Frontend Issues

- **Wallet not connecting**: Ensure MetaMask or your wallet is installed and unlocked
- **Wrong network**: Make sure your wallet is connected to Sepolia testnet
- **Contract not found**: Verify the contract address in `App.tsx` matches your deployed contract
- **IPFS upload fails**: Check your Pinata JWT token is valid

## Security Notes

⚠️ **IMPORTANT**:

- Never commit private keys or sensitive credentials to version control
- Use environment variables for production deployments
- The private key in `hardhat.config.cjs` is for testing only - use a test wallet
- Consider using `.env` files (and add them to `.gitignore`) for sensitive data

## License

MIT

## Support

For issues or questions, please open an issue on the repository.
