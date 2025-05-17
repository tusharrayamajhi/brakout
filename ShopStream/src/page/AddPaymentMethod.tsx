import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../component/Sidebar";
import Topbar from "../component/Topbar";
import API_URL from "../api/api_url";

// Extend the Window interface to include the solana property
declare global {
  interface Window {
    solana?: {
      isPhantom: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      publicKey: { toString: () => string };
    };
  }
}

const AddPaymentMethod = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [stripeCode, setStripeCode] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState("");
  const [walletError, setWalletError] = useState("");
  const [esewaError, setEsewaError] = useState("");
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [loadingEsewa, setLoadingEsewa] = useState(false);
  const [esewaMerchantCode, setEsewaMerchantCode] = useState("");
  

  const [payments, setPayments] = useState<any[]>([]);
const [loadingPayments, setLoadingPayments] = useState(false);
const [paymentsError, setPaymentsError] = useState("");



  const handleLogout = () => {
    sessionStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {
    const jwt = sessionStorage.getItem("token");
    if (!jwt) {
      navigate("/");
    } else {
      setToken(jwt);
      fetchUser(jwt);
    }
  }, [navigate]);

  const fetchUser = async (jwt: string) => {
    try {
      const res = await fetch(`${API_URL}auth/profile`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setStripeError("Session expired. Please log in again.");
          sessionStorage.removeItem("token");
          navigate("/");
          return;
        }
        throw new Error(data.message || "Failed to fetch user profile");
      }
      setUserData(data);
      if (!data.businesses) {
        navigate("/business-details");
      }
    } catch (err) {
      console.error(err);
      setStripeError("Failed to load user profile.");
      sessionStorage.removeItem("token");
      navigate("/");
    }
  };
  useEffect(() => {
  if (token) {
    fetchPayments();
  }
}, [token]);
const fetchPayments = async () => {
  setLoadingPayments(true);
  setPaymentsError("");
  try {
    const res = await fetch(`${API_URL}payment`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch payments");
    }
    setPayments(data); // Assuming data is an array of payment objects
  } catch (err: any) {
    setPaymentsError(err.message || "Error fetching payments");
  } finally {
    setLoadingPayments(false);
  }
};

  const connectStripe = () => {
    const clientId = "ca_SFZNegQBVAu8cUC6AlC8RYeEHqiGp8If";
    const redirectUri = "http://localhost:5173/payment";
    const scope = "read_write";
    const authUrl = `https://connect.stripe.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scope}&response_type=code`;
    window.location.href = authUrl;
  };

  const exchangeCodeForToken = async (code: string) => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        setStripeError("Authentication token missing. Please log in.");
        sessionStorage.removeItem("token");
        navigate("/");
        return;
      }

      setLoadingStripe(true);
      const res = await fetch(`${API_URL}stripe/connect?code=${code}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        alert("Stripe account connected successfully!");
        navigate("/dashboard");
      } else {
        setStripeError(data.message || "Error connecting to Stripe");
      }
    } catch (err: any) {
      setStripeError("Error connecting to Stripe: " + err.message);
    } finally {
      setLoadingStripe(false);
    }
  };

  const connectPhantomWallet = async () => {
    try {
      setLoadingWallet(true);
      setWalletError("");

      if (!window.solana || !window.solana.isPhantom) {
        setWalletError("Phantom wallet not installed. Please install it.");
        return;
      }

      const provider = window.solana;
      await provider.connect();
      const publicKey = provider.publicKey.toString();

      const token = sessionStorage.getItem("token");
      if (!token) {
        setWalletError("Authentication token missing. Please log in.");
        sessionStorage.removeItem("token");
        navigate("/");
        return;
      }

      const res = await fetch(
        `${API_URL}wallet/connect?publickey=${publicKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (res.ok) {
        alert("Wallet connected");
        navigate("/payment");
      } else {
        setWalletError(data.message || "Error connecting Phantom wallet");
      }
    } catch (err: any) {
      if (err.code === 4001) {
        setWalletError("Connection rejected by user.");
      } else {
        setWalletError("Error connecting Phantom wallet: " + err.message);
      }
    } finally {
      setLoadingWallet(false);
    }
  };

  const connectEsewa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoadingEsewa(true);
      setEsewaError("");

      const token = sessionStorage.getItem("token");
      if (!token) {
        setEsewaError("Authentication token missing. Please log in.");
        sessionStorage.removeItem("token");
        navigate("/");
        return;
      }

      if (!esewaMerchantCode) {
        setEsewaError("Please enter a valid merchant code.");
        return;
      }

      const res = await fetch(`${API_URL}esewa/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ merchantCode: esewaMerchantCode }),
      });

      const data = await res.json();
      if (data.status === 200) {
        alert(data.message);
        navigate("/payment");
      } else {
        setEsewaError(data.message || "Error connecting eSewa account");
      }
    } catch (err: any) {
      setEsewaError("Error connecting eSewa: " + err.message);
    } finally {
      setLoadingEsewa(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    if (code) {
      setStripeCode(code);
      exchangeCodeForToken(code);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);

  if (!userData) {
    return <div className="p-10">Loading...</div>;
  }

  const { name, email, profilePicture } = userData;
  const business = userData.businesses;

  return (
  <div className="flex w-screen h-screen overflow-hidden">
    <Sidebar />
    <div className="flex-1 overflow-y-auto bg-gray-100 min-h-screen">
      <Topbar
        user={{ name, email, profilePicture }}
        business={{
          name: business?.name || "",
          logoUrl: business?.logoUrl || "",
          website: business?.website || "",
        }}
        onLogout={handleLogout}
      />

      <div className="p-8 space-y-10">
        {/* Stripe */}
        <div className="bg-white p-6 rounded shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <img src="https://th.bing.com/th/id/OIP.g5G3Zw43IVisB87ZXGjiNQHaDB?rs=1&pid=ImgDetMain" alt="Stripe" className="h-8" />
              <h2 className="text-xl font-semibold"> connect Stripe Account</h2>
            </div>
            <button
              onClick={connectStripe}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              disabled={loadingStripe}
            >
              {loadingStripe ? "Connecting..." : "Connect Stripe Account"}
            </button>
          </div>
          {stripeError && <p className="text-red-500">{stripeError}</p>}
        </div>

        {/* Phantom Wallet */}
        <div className="bg-white p-6 rounded shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <img src="https://th.bing.com/th/id/OIP.pSZYRnNw0F1hZYScqIvjpwAAAA?rs=1&pid=ImgDetMain" alt="Phantom" className="h-8" />
              <h2 className="text-xl font-semibold">connect Phantom Wallet</h2>
            </div>
            <button
              onClick={connectPhantomWallet}
              className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
              disabled={loadingWallet}
            >
              {loadingWallet ? "Connecting..." : "Connect Phantom Wallet"}
            </button>
          </div>
          {walletError && <p className="text-red-500">{walletError}</p>}
        </div>

        {/* eSewa */}
        <div className="bg-white p-6 rounded shadow">
          <div className="flex items-center space-x-4 mb-4">
            <img src="https://lh3.googleusercontent.com/Imp5kLEg6mIoYZcsyQoTUQdIIP3gpVPJyxNUj10eqRa1Alw9rf4UkuY_W4xZcl2nCHU=w300" alt="eSewa" className="h-8" />
            <h2 className="text-xl font-semibold">add eSewa merchant code</h2>
          </div>
          <form onSubmit={connectEsewa} className="space-y-4">
            <div>
              <label
                htmlFor="merchantCode"
                className="block text-sm font-medium text-gray-700"
              >
                eSewa Merchant Code
              </label>
              <input
                type="text"
                id="merchantCode"
                value={esewaMerchantCode}
                onChange={(e) => setEsewaMerchantCode(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-green-400 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                placeholder="Enter your eSewa merchant code"
                disabled={loadingEsewa}
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              disabled={loadingEsewa}
            >
              {loadingEsewa ? "Connecting..." : "Connect eSewa Account"}
            </button>
          </form>
          {esewaError && <p className="text-red-500 mt-2">{esewaError}</p>}
        </div>
      </div>
      {/* Payment Records Table */}
<div className="bg-white p-6 rounded shadow mt-10">
  <h2 className="text-xl font-semibold mb-4">Payment Records</h2>

  {loadingPayments ? (
    <p>Loading payments...</p>
  ) : paymentsError ? (
    <p className="text-red-500">{paymentsError}</p>
  ) : payments.length === 0 ? (
    <p>No payment records found.</p>
  ) : (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            {/* <th className="border px-4 py-2 text-left">Email</th> */}
            <th className="border px-4 py-2 text-left">Payment Method</th>
            <th className="border px-4 py-2 text-left">Transaction UUID</th>
            {/* <th className="border px-4 py-2 text-left">Raw Response</th> */}
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className="border px-4 py-2">{payment.methodType}</td>
              <td className="border px-4 py-2">{payment.stripeUserId ? payment.stripeUserId : payment.merchantCode ? payment.merchantCode : payment.walletAddress }</td>
              {/* <td className="border px-4 py-2 break-words max-w-xs">{payment.stripeUserId}</td> */}
              {/* <td className="border px-4 py-2 max-w-md whitespace-pre-wrap break-words">{payment.raw_response}</td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

    </div>
  </div>
);

};

export default AddPaymentMethod;
