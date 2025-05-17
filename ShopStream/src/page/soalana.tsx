import React, { useEffect, useState } from "react";
import { Buffer } from "buffer";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  clusterApiUrl
} from "@solana/web3.js";
import { useParams, useNavigate } from "react-router-dom";
import API_URL from "../api/api_url";

interface PaymentData {
  recipient: string;
  amount: number | string;
  memo?: string;
  label?: string;
  message?: string;
  reference?: string;
}

export default function SolanaRedirect() {
  const { userId, orderId, businessId } = useParams();
  const navigate = useNavigate();

  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !orderId || !businessId) return;

    const fetchPaymentData = async () => {
      try {
        const res = await fetch(
          `${API_URL}solana/${orderId}/${userId}/${businessId}`
        );
        const data = await res.json();

        if (res.ok) {
          setPaymentData(data);
        } else {
          alert(data.message || "Failed to fetch payment info.");
          navigate("/");
        }
      } catch (error) {
        console.error("Backend fetch error:", error);
        alert("Something went wrong while fetching payment info.");
        navigate("/");
      }
    };

    fetchPaymentData();
  }, [userId, orderId, businessId, navigate]);

  // useEffect(() => {
  //   if (paymentData) {
  //     handlePayment();
  //   }
  // }, [paymentData]);

  const handlePayment = async () => {
    if (!paymentData) return;

    try {
      setLoading(true);

      const provider = (window as any).solana;
      if (!provider?.isPhantom) {
        alert("Phantom wallet not detected. Please install it.");
        setLoading(false);
        return;
      }

      await provider.connect();
      const sender = provider.publicKey;
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

      const amountSol =
        typeof paymentData.amount === "string"
          ? parseFloat(paymentData.amount)
          : paymentData.amount;
      if (isNaN(amountSol) || amountSol <= 0) {
        alert("Invalid payment amount.");
        setLoading(false);
        return;
      }

      const requiredLamports = Math.round(amountSol * LAMPORTS_PER_SOL);

      const balance = await connection.getBalance(sender);
      if (balance < requiredLamports) {
        alert(
          `Insufficient balance: You have ${
            balance / LAMPORTS_PER_SOL
          } SOL but need ${amountSol} SOL.`
        );
        setLoading(false);
        return;
      }

      const recipient = new PublicKey(paymentData.recipient);
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: sender,
        toPubkey: recipient,
        lamports: requiredLamports,
      });

      if (paymentData.reference) {
        transferInstruction.keys.push({
          pubkey: new PublicKey(paymentData.reference),
          isSigner: false,
          isWritable: false,
        });
      }

      const transaction = new Transaction().add(transferInstruction);

      if (paymentData.memo) {
        const memoProgramId = new PublicKey(
          "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
        );
        transaction.add({
          keys: [],
          programId: memoProgramId,
          data: Buffer.from(paymentData.memo),
        });
      }

      transaction.feePayer = sender;
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      const signed = await provider.signTransaction(transaction);
      const txid = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(txid, "confirmed");

      alert("✅ Payment successful! Transaction ID: " + txid);

      window.location.replace(
        `http://localhost:5678/webhook/3dfb292b-9497-444d-8259-9f91d2c7b2ae/success?method=solana&orderId=${orderId}&userId=${userId}&businessId=${businessId}&txid=${txid}&reference=${paymentData.reference}`
      );
    } catch (err: any) {
      console.error("Transaction failed:", err);
      alert("❌ Payment failed: " + (err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  };

  if (!paymentData) {
    return <div className="text-center mt-20">Fetching payment info...</div>;
  }

  return (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <h2 className="text-xl font-semibold mb-4">Pay with Phantom</h2>
    <p className="mb-2">
      Amount: <strong>{paymentData?.amount} SOL</strong>
    </p>
    <button
      onClick={handlePayment}
      disabled={loading}
      className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
    >
      {loading ? "Processing..." : "Pay Now"}
    </button>
  </div>
);
}
