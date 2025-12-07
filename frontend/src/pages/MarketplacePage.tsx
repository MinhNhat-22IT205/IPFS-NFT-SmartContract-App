// src/App.tsx
import { useState, useEffect } from "react";
import axios from "axios";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther, parseEther } from "viem";

// CẬP NHẬT 2 DÒNG NÀY
const PINATA_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI5OTNlZjk2Ny0xNWYwLTQ1NjAtODcxYS00ZDRmNjM0MDc1MmUiLCJlbWFpbCI6Im5oYXRtaW5obGVkYW8yMDA0QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI5NzdkZjAxM2EzMGNmM2I3OGU3NSIsInNjb3BlZEtleVNlY3JldCI6Ijc4NTZkOTA5MGJhMTgyYTQwZWJiYmNkMzRhMmY3Mzk5YWE4NWYxNDE1ODI3ZjBhZDkzMzIyZWQzMDEyMmEyYWMiLCJleHAiOjE3OTY1MTc5MjB9.5YHMne_ORNXqhu8BKydvtCJjD5C1F4S0TaGLI5F2i3s";
const NFT_CONTRACT = "0x193d3F0aCBAf1BA2d5BC4620c773BBf05E720191";
const MARKETPLACE = "0xFd67cD52d48eaC1c0cb1971B752220C8587c9eb0";

const NFT_ABI = [
  {
    inputs: [{ name: "cid", type: "string" }],
    name: "mintNFT",
    outputs: [{ type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const MARKETPLACE_ABI = [
  {
    inputs: [
      { name: "nftContract", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "price", type: "uint256" },
    ],
    name: "listForSale",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "listingId", type: "uint256" }],
    name: "buy",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "getActiveListings",
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "listingId", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "nftContract", type: "address" },
          { name: "tokenId", type: "uint256" },
          { name: "price", type: "uint256" },
          { name: "active", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [price, setPrice] = useState("");
  const [tokenId, setTokenId] = useState("");
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: txLoading } = useWaitForTransactionReceipt({ hash });

  const { data: listings } = useReadContract({
    address: MARKETPLACE,
    abi: MARKETPLACE_ABI,
    functionName: "getActiveListings",
  });

  const [nftMetadata, setNftMetadata] = useState<any[]>([]);

  useEffect(() => {
    if (listings) {
      const fetchMetadata = async () => {
        const metas = await Promise.all(
          listings.map(async (l: any) => {
            try {
              const uri = `https://gateway.pinata.cloud/ipfs/${l.tokenId}`; // giả sử CID = tokenId (có thể cải thiện)
              const res = await fetch(
                uri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
              );
              if (!res.ok) return null;
              return await res.json();
            } catch {
              return {
                name: `NFT #${l.tokenId}`,
                image: "https://via.placeholder.com/300",
              };
            }
          })
        );
        setNftMetadata(metas);
      };
      fetchMetadata();
    }
  }, [listings]);

  const mintAndUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: { Authorization: `Bearer ${PINATA_JWT}` },
      }
    );
    const cid = res.data.IpfsHash;

    // Tạo metadata
    const metadata = { name: file.name, image: `ipfs://${cid}` };
    const metaBlob = new Blob([JSON.stringify(metadata)], {
      type: "application/json",
    });
    const metaForm = new FormData();
    metaForm.append("file", metaBlob, "metadata.json");
    const metaRes = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      metaForm,
      {
        headers: { Authorization: `Bearer ${PINATA_JWT}` },
      }
    );

    writeContract({
      address: NFT_CONTRACT,
      abi: NFT_ABI,
      functionName: "mintNFT",
      args: [metaRes.data.IpfsHash],
    });
  };

  const listForSale = () => {
    writeContract({
      address: MARKETPLACE,
      abi: MARKETPLACE_ABI,
      functionName: "listForSale",
      args: [NFT_CONTRACT, BigInt(tokenId), parseEther(price)],
    });
  };

  // Thêm nút Approve
  const approveMarketplace = () => {
    writeContract({
      address: NFT_CONTRACT,
      abi: [
        {
          name: "setApprovalForAll",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "operator", type: "address" },
            { name: "approved", type: "bool" },
          ],
          outputs: [],
        },
      ],
      functionName: "setApprovalForAll",
      args: [MARKETPLACE, true],
    });
  };

  const buy = (listingId: bigint, price: bigint) => {
    writeContract({
      address: MARKETPLACE,
      abi: MARKETPLACE_ABI,
      functionName: "buy",
      args: [listingId],
      value: price,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 text-white p-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-6xl font-bold text-center mb-10">
          Mini NFT Marketplace
        </h1>
        <ConnectButton />

        <div className="bg-red-600/20 p-4 rounded-lg mb-4 border border-red-500">
          <p className="text-sm mb-2">
            Bước quan trọng: Approve marketplace trước khi list!
          </p>
          <button
            onClick={approveMarketplace}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-bold"
          >
            1. Approve Marketplace (chỉ cần làm 1 lần duy nhất)
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-10 mt-10">
          {/* Mint */}
          <div className="bg-white/10 p-8 rounded-2xl">
            <h2 className="text-3xl mb-6">1. Mint NFT</h2>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block mb-4"
            />
            <button
              onClick={mintAndUpload}
              disabled={txLoading}
              className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-lg text-xl"
            >
              {txLoading ? "Minting..." : "Mint NFT"}
            </button>
          </div>

          {/* List */}
          <div className="bg-white/10 p-8 rounded-2xl">
            <h2 className="text-3xl mb-6">2. List for Sale</h2>
            <input
              placeholder="Token ID"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              className="input mb-4"
            />
            <input
              placeholder="Price (ETH)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input mb-4"
            />
            <button
              onClick={listForSale}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-xl"
            >
              List for Sale
            </button>
          </div>
        </div>

        {/* Marketplace */}
        <h2 className="text-5xl text-center my-16">NFTs for Sale</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {listings?.map((listing: any, i) => (
            <div
              key={i}
              className="bg-white/10 rounded-2xl overflow-hidden hover:scale-105 transition"
            >
              <img
                src={
                  nftMetadata[i]?.image?.replace(
                    "ipfs://",
                    "https://gateway.pinata.cloud/ipfs/"
                  ) || "https://via.placeholder.com/300"
                }
                alt="NFT"
                className="w-full h-64 object-cover"
              />
              <div className="p-6">
                <h3 className="text-2xl font-bold">
                  {nftMetadata[i]?.name || `NFT #${listing.tokenId}`}
                </h3>
                <p className="text-3xl font-bold text-green-400 my-4">
                  {formatEther(listing.price)} ETH
                </p>
                <button
                  onClick={() => buy(listing.listingId, listing.price)}
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 py-4 rounded-lg text-xl font-bold"
                >
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
