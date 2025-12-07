import { useState, useEffect } from "react";
import axios from "axios";
import { Puff } from "react-loader-spinner";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const NFT_SAVE_CONTRACT_ADDRESS = "0x193d3F0aCBAf1BA2d5BC4620c773BBf05E720191";
const PINATA_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI5OTNlZjk2Ny0xNWYwLTQ1NjAtODcxYS00ZDRmNjM0MDc1MmUiLCJlbWFpbCI6Im5oYXRtaW5obGVkYW8yMDA0QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI5NzdkZjAxM2EzMGNmM2I3OGU3NSIsInNjb3BlZEtleVNlY3JldCI6Ijc4NTZkOTA5MGJhMTgyYTQwZWJiYmNkMzRhMmY3Mzk5YWE4NWYxNDE1ODI3ZjBhZDkzMzIyZWQzMDEyMmEyYWMiLCJleHAiOjE3OTY1MTc5MjB9.5YHMne_ORNXqhu8BKydvtCJjD5C1F4S0TaGLI5F2i3s"; // ← Put in .env later

const NFT_ABI = [
  {
    inputs: [{ name: "_cid", type: "string" }],
    name: "mintNFT",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

export default function MintPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("Chọn file để mint NFT");
  const [uploading, setUploading] = useState(false);
  const [nftMetadata, setNftMetadata] = useState<NFTMetadata | null>(null);
  const [nftImageUrl, setNftImageUrl] = useState("");

  const { isConnected, address } = useAccount();
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: txLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Helper function to convert IPFS URL to HTTP gateway URL
  const ipfsToHttp = (ipfsUrl: string): string => {
    if (ipfsUrl.startsWith("ipfs://")) {
      const cid = ipfsUrl.replace("ipfs://", "");
      // Try multiple IPFS gateways for reliability
      return `https://gateway.pinata.cloud/ipfs/${cid}`;
    }
    return ipfsUrl;
  };

  // 1. Upload ảnh + tạo metadata + mint NFT
  const handleMint = async () => {
    if (!file || !isConnected) return;

    setUploading(true);
    try {
      // Bước 1: Upload file gốc (ảnh, video, v.v.)
      const formData = new FormData();
      formData.append("file", file);
      const meta = JSON.stringify({ name: file.name });
      formData.append("pinataMetadata", meta);

      const uploadRes = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        { headers: { Authorization: `Bearer ${PINATA_JWT}` } }
      );
      const imageCid = uploadRes.data.IpfsHash;
      const imageUrl = `ipfs://${imageCid}`;

      // Bước 2: Tạo metadata JSON đính cid
      const metadata = {
        name: file.name.split(".")[0],
        description: "NFT được mint từ MVP IPFS + Pinata + RainbowKit",
        image: imageUrl,
        attributes: [
          { trait_type: "Creator", value: address?.slice(0, 8) },
          { trait_type: "Date", value: new Date().toISOString().split("T")[0] },
        ],
      };

      // Bước 3: Upload metadata JSON lên Pinata
      const metadataBlob = new Blob([JSON.stringify(metadata)], {
        type: "application/json",
      });
      const metadataForm = new FormData();
      metadataForm.append("file", metadataBlob, "metadata.json");

      const metaRes = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        metadataForm,
        { headers: { Authorization: `Bearer ${PINATA_JWT}` } }
      );

      const metadataCid = metaRes.data.IpfsHash;

      // Bước 4: Mint NFT với CID của metadata
      writeContract({
        address: NFT_SAVE_CONTRACT_ADDRESS,
        abi: NFT_ABI,
        functionName: "mintNFT",
        args: [metadataCid],
      });

      // Store metadata CID to fetch after transaction completes
      localStorage.setItem("pendingMetadataCid", metadataCid);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      alert("Lỗi: " + (err.response?.data?.error || err.message));
    }
    setUploading(false);
  };

  // Fetch NFT metadata when transaction succeeds
  useEffect(() => {
    if (isSuccess) {
      const pendingCid = localStorage.getItem("pendingMetadataCid");
      if (pendingCid) {
        // Fetch NFT metadata from IPFS
        const fetchNFTMetadata = async (metadataCid: string) => {
          try {
            const metadataUrl = ipfsToHttp(`ipfs://${metadataCid}`);
            const response = await axios.get(metadataUrl);
            const metadata: NFTMetadata = response.data;
            setNftMetadata(metadata);

            // Convert image IPFS URL to HTTP gateway URL
            if (metadata.image) {
              setNftImageUrl(ipfsToHttp(metadata.image));
            }
          } catch (error) {
            console.error("Error fetching NFT metadata:", error);
          }
        };

        fetchNFTMetadata(pendingCid);
        localStorage.removeItem("pendingMetadataCid");
      }
    }
  }, [isSuccess]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 p-6">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-2">IPFS → NFT Minter</h1>
        <p className="text-xl opacity-80">
          Upload file → Mint NFT trên Sepolia trong 15 giây
        </p>
      </div>

      <ConnectButton />

      {isConnected && (
        <>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-8 max-w-md w-full">
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setFile(e.target.files[0]);
                  setFileName(e.target.files[0].name);
                }
              }}
              className="block w-full text-sm text-gray-300 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:bg-violet-600 file:text-white hover:file:bg-violet-700"
            />
            <p className="mt-2 text-sm opacity-70 truncate">{fileName}</p>

            <button
              onClick={handleMint}
              disabled={!file || uploading || txLoading}
              className="mt-6 w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-full disabled:opacity-50 transition"
            >
              {uploading || txLoading
                ? txLoading
                  ? "Đang mint NFT trên blockchain..."
                  : "Đang upload lên IPFS..."
                : "MINT NFT NGAY"}
            </button>
          </div>

          {(uploading || txLoading) && (
            <Puff color="#a78bfa" height={100} width={100} />
          )}

          {isSuccess && nftMetadata && (
            <div className="bg-green-900/50 backdrop-blur border border-green-500 rounded-2xl p-8 max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-6 text-center">
                NFT ĐÃ MINT THÀNH CÔNG! 🎉
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* NFT Image */}
                <div className="flex flex-col items-center">
                  {nftImageUrl && (
                    <div className="rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl">
                      <img
                        src={nftImageUrl}
                        alt={nftMetadata.name}
                        className="w-full h-auto max-h-96 object-contain"
                        onError={(e) => {
                          // Fallback to another IPFS gateway if first fails
                          const target = e.target as HTMLImageElement;
                          if (target.src.includes("pinata.cloud")) {
                            const cid = target.src.split("/ipfs/")[1];
                            target.src = `https://ipfs.io/ipfs/${cid}`;
                          }
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* NFT Details */}
                <div className="flex flex-col justify-center space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-cyan-400">
                      {nftMetadata.name}
                    </h3>
                    <p className="text-gray-300 text-sm">
                      {nftMetadata.description}
                    </p>
                  </div>

                  {nftMetadata.attributes &&
                    nftMetadata.attributes.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold mb-2 text-gray-400">
                          Attributes:
                        </h4>
                        <div className="space-y-2">
                          {nftMetadata.attributes.map((attr, idx) => (
                            <div
                              key={idx}
                              className="bg-white/5 rounded-lg p-2 text-sm"
                            >
                              <span className="text-gray-400">
                                {attr.trait_type}:
                              </span>{" "}
                              <span className="text-white font-medium">
                                {attr.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {hash && (
                    <div className="pt-4 border-t border-white/10">
                      <a
                        href={`https://sepolia.etherscan.io/tx/${hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-yellow-400 hover:text-yellow-300 text-sm underline"
                      >
                        Xem giao dịch trên Etherscan
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
