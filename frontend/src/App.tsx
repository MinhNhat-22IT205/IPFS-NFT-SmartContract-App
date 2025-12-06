import { useState } from "react";
import axios from "axios";
import { Puff } from "react-loader-spinner";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

// UPDATE THESE TWO
const CONTRACT_ADDRESS = "0x78999B11d2b11a968CB5Fd03D5062200bE7Dc682"; // ← I'll deploy it for you below
const PINATA_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI5OTNlZjk2Ny0xNWYwLTQ1NjAtODcxYS00ZDRmNjM0MDc1MmUiLCJlbWFpbCI6Im5oYXRtaW5obGVkYW8yMDA0QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI5NzdkZjAxM2EzMGNmM2I3OGU3NSIsInNjb3BlZEtleVNlY3JldCI6Ijc4NTZkOTA5MGJhMTgyYTQwZWJiYmNkMzRhMmY3Mzk5YWE4NWYxNDE1ODI3ZjBhZDkzMzIyZWQzMDEyMmEyYWMiLCJleHAiOjE3OTY1MTc5MjB9.5YHMne_ORNXqhu8BKydvtCJjD5C1F4S0TaGLI5F2i3s"; // ← Put in .env later

// Minimal ABI
const ABI = [
  {
    inputs: [{ name: "_cid", type: "string" }],
    name: "setCID",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getCID",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [ipfsUrl, setIpfsUrl] = useState("");
  const [loading, setLoading] = useState(false);
  //frontend sẽ luôn hiển thị CID mới nhất đã lưu on-chain.
  const { data: cidOnChain } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "getCID", //function dinh nghia trong .sol
  });

  const { isConnected } = useAccount();
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: txLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleUpload = async () => {
    if (!file || !isConnected) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        { headers: { Authorization: `Bearer ${PINATA_JWT}` } }
      );

      const cid = res.data.IpfsHash;
      const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
      setIpfsUrl(url);

      // Save to blockchain
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "setCID", //function dinh nghia trong .sol
        args: [cid],
      });
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      alert("Error: " + (err as any).message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold">IPFS + Blockchain MVP</h1>

      <ConnectButton />

      {cidOnChain && (
        <div className="text-green-400 mt-4">
          CID đang lưu trên blockchain: <br />
          <span className="font-bold">{cidOnChain}</span>
          <br />
          <a
            href={`https://gateway.pinata.cloud/ipfs/${cidOnChain}`}
            target="_blank"
            className="underline text-cyan-400"
          >
            ⚡ Xem file trên IPFS
          </a>
        </div>
      )}

      {isConnected && (
        <>
          Upload new file: <br />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="file:input file:btn"
          />
          <button
            onClick={handleUpload}
            disabled={!file || loading || txLoading}
            className="btn btn-primary text-lg px-8"
          >
            {loading || txLoading
              ? "Uploading & Saving..."
              : "Upload + Save to Sepolia"}
          </button>
          {(loading || txLoading) && (
            <Puff color="#00BFFF" height={80} width={80} />
          )}
          {ipfsUrl && (
            <div className="bg-green-900 p-6 rounded-lg text-center">
              <p>File Live on IPFS:</p>
              <a
                href={ipfsUrl}
                target="_blank"
                className="text-cyan-400 underline"
              >
                {ipfsUrl}
              </a>
              {isSuccess && hash && (
                <p className="mt-4">
                  CID saved on-chain!
                  <a
                    href={`https://sepolia.etherscan.io/tx/${hash}`}
                    target="_blank"
                    className="text-yellow-400"
                  >
                    View Tx
                  </a>
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
