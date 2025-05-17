import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../component/Sidebar";
import Topbar from "../component/Topbar";
import API_URL from "../api/api_url";
import Stripe from "stripe";

const Orders = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const jwt = sessionStorage.getItem("token");
    if (!jwt) {
      navigate("/");
    } else {
      setToken(jwt);
      fetchUserAndBusiness(jwt);
    }
  }, [navigate]);

  const fetchUserAndBusiness = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}auth/profile`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setUserData(data);

      if (data.businesses == null) {
        navigate("/business-details");
      } else {
        fetchOrders(token, data.businesses.id);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setLoading(false);
    }
  };

  const fetchOrders = async (token: string, businessId: string) => {
    try {
      const res = await fetch(`${API_URL}orders?businessId=${businessId}`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setOrders(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    navigate("/");
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_URL}orders/status/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      } else {
        console.error("Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  if (loading || !userData) {
    return <div className="p-10">Loading...</div>;
  }

  const { name, email, profilePicture } = userData;
  const business = userData.businesses;

  return (
    <div className="flex w-screen h-screen">
      <Sidebar />
      <div className="flex-1 bg-gray-100 min-h-screen">
        <Topbar
          user={{ name, email, profilePicture }}
          business={{
            name: business.name,
            logoUrl: business.logoUrl,
            website: business.website,
          }}
          onLogout={handleLogout}
        />
        <div className="p-8 overflow-auto max-w-full">
          <h2 className="text-2xl font-semibold mb-6">Orders</h2>
          {orders.length === 0 ? (
            <p>No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full w-full table-fixed bg-white shadow-md rounded-lg">
                <thead>
                  <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left truncate">Order ID</th>
                    <th className="py-3 px-6 text-left truncate">Customer</th>
                    <th className="py-3 px-6 text-left truncate">
                      Total Amount
                    </th>
                    <th className="py-3 px-6 text-left truncate">Status</th>
                    <th className="py-3 px-6 text-left truncate">Created At</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm font-light">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-200 hover:bg-gray-100"
                    >
                      <td
                        className="py-3 px-6 text-left whitespace-nowrap cursor-pointer truncate max-w-xs"
                        onClick={() => navigate(`/order-details/${order.id}`)}
                        title={order.id} /* Shows full ID on hover */
                      >
                        {order.id}
                      </td>
                      <td
                        className="py-3 px-6 text-left truncate max-w-xs"
                        title={order.customer.fullName}
                      >
                        {order.customer.fullName}
                      </td>
                      <td className="py-3 px-6 text-left truncate">
                        ${order.total_amount}
                      </td>
                      <td className="py-3 px-6 text-left">
                        <select
                          value={order.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value)
                          }
                          className={`py-1 px-3 rounded-full text-xs border ${
                            order.status === "pending"
                              ? "bg-yellow-200 text-yellow-800"
                              : order.status === "shipping"
                              ? "bg-blue-200 text-blue-800"
                              : "bg-green-200 text-green-800"
                          }`}
                        >
                          <option value="pending">pending</option>
                          <option value="shipping">shipping</option>
                          <option value="delivered">delivered</option>
                        </select>
                      </td>
                      <td className="py-3 px-6 text-left truncate">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
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

export default Orders;

// OrderDetails Component
const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string | null>(
    null
  );

  useEffect(() => {
    const jwt = sessionStorage.getItem("token");
    if (!jwt) {
      navigate("/");
    } else {
      setToken(jwt);
      fetchUserAndBusiness(jwt);
    }
  }, [navigate]);

  const fetchUserAndBusiness = async (token: string) => {
    try {
      const res = await fetch("http://localhost:3000/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setUserData(data);

      if (data.businesses == null) {
        navigate("/business-details");
      } else {
        fetchOrder(token, orderId!);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setLoading(false);
    }
  };

  const fetchOrder = async (token: string, orderId: string) => {
    try {
      const res = await fetch(`http://localhost:3000/orders/${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setOrder(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching order:", err);
      setLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!order.payment) {
      setVerificationResult("No payment data available.");
      return;
    }

    setVerifying(true);
    setVerificationResult(null);

    try {
      if (order.payment.payment_method == "esewa") {
        const jsonString = atob(order.payment.transaction_uuid); // decode Base64
        const parsed = JSON.parse(jsonString); // parse JSON
        console.log(parsed);
        const res = await fetch(
          `https://rc.esewa.com.np/api/epay/transaction/status/?product_code=${parsed.product_code}&total_amount=${parsed.total_amount}&transaction_uuid=${parsed.transaction_uuid}`
        );
        console.log(res);

        const data = await res.json();

        console.log("eSewa Status Response:", data);
        setVerificationResult(
          data.status === "success"
            ? `Payment Received (Method: ${order.payment.payment_method})`
            : `Payment Not Received - Status: ${data.status} (Method: ${order.payment.payment_method})`
        );
      }
      console.log(order.payment.transaction_uuid);
      if (order.payment.payment_method == "stripe") {
        const stripe = new Stripe(
          ""
        );
        const session = await stripe.checkout.sessions.retrieve(
          order.payment.transaction_uuid
        );

        if (session.payment_status == "paid") {
          console.log("Payment was successful");
          // Update your database or perform other actions
        } else {
          console.log(
            "Payment has not succeeded. Status:",
            session.payment_status
          );
        }
      }
      if(order.payment.payment_method == "solana"){
      const signatureInfo = await findReference(connection, reference, { finality: 'confirmed' });
      }
    } catch (err) {
      console.error("Error verifying payment:", err);
      setVerificationResult("Failed to verify payment.");
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    navigate("/");
  };

  if (loading || !userData || !order) {
    return <div className="p-10">Loading...</div>;
  }

  const { name, email, profilePicture } = userData;
  const business = userData.businesses;

  return (
    <div className="flex w-screen h-screen">
      <Sidebar />
      <div className="flex-1 bg-gray-100 min-h-screen">
        <Topbar
          user={{ name, email, profilePicture }}
          business={{
            name: business.name,
            logoUrl: business.logoUrl,
            website: business.website,
          }}
          onLogout={handleLogout}
        />
        <div className="p-8 flex justify-center">
          <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg p-8 border border-gray-200">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center">
                {business.logoUrl && (
                  <img
                    src={business.logoUrl}
                    alt={business.name}
                    className="w-16 h-16 object-contain mr-4"
                  />
                )}
                <h2 className="text-2xl font-bold text-gray-800">
                  Order Invoice
                </h2>
              </div>
              <div>
                <span className="text-sm text-gray-600">Invoice #:</span>{" "}
                <span className="font-semibold">{order.id}</span>
              </div>
            </div>

            {/* Verify Payment Button */}
            {order.payment && (
              <div className="mb-6">
                <button
                  onClick={handleVerifyPayment}
                  disabled={verifying}
                  className={`py-2 px-6 rounded-lg text-white font-semibold ${
                    verifying
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  } transition-colors`}
                >
                  {verifying ? "Verifying..." : "Verify Payment"}
                </button>
                {verificationResult && (
                  <p
                    className={`mt-2 text-sm ${
                      verificationResult.includes("Received")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {verificationResult}
                  </p>
                )}
              </div>
            )}

            {/* Bill Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Information */}
              <div className="col-span-1">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  Order Information
                </h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Order ID:</span> {order.id}
                  </p>
                  <p>
                    <span className="font-medium">Total Amount:</span> $
                    {order.total_amount}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs ${
                        order.status === "pending"
                          ? "bg-yellow-200 text-yellow-800"
                          : order.status === "shipping"
                          ? "bg-green-200 text-green-800"
                          : order.status === "delivered"
                          ? "bg-blue-200 text-blue-800"
                          : "bg-red-200 text-red-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Created At:</span>{" "}
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">Updated At:</span>{" "}
                    {new Date(order.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Customer Information */}
              <div className="col-span-1">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  Customer Information
                </h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Name:</span>{" "}
                    {order.customer.fullName}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {order.customer.email || "N/A"}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="col-span-1 md:col-span-2 mt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  Order Items
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-600">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="py-3 px-4">Product</th>
                        {/* <th className="py-3 px-4">Description</th> */}
                        <th className="py-3 px-4">Quantity</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4">Color</th>
                        <th className="py-3 px-4">Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.orderItem.map((item: any) => (
                        <tr key={item.id} className="border-b">
                          <td className="py-3 px-4 flex items-center">
                            {item.product.imageUrl && (
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.productName}
                                className="w-12 h-12 object-cover mr-2"
                              />
                            )}
                            {item.product.productName}
                          </td>
                          {/* <td className="py-3 px-4">
                            {item.product.description}
                          </td> */}
                          <td className="py-3 px-4">{item.quantity}</td>
                          <td className="py-3 px-4">${item.price}</td>
                          <td className="py-3 px-4">
                            {item.product.color || "N/A"}
                          </td>
                          <td className="py-3 px-4">{item.size || "NA"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Information */}
              <div className="col-span-1 md:col-span-2 mt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  Payment Information
                </h3>
                {order.payment ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <p>
                      <span className="font-medium">Payment ID:</span>{" "}
                      {order.payment.id}
                    </p>
                    <p>
                      <span className="font-medium">Transaction UUID:</span>{" "}
                      {order.payment.transaction_uuid || "N/A"}
                    </p>
                    {/* <p>
                      <span className="font-medium">Total Amount:</span> $
                      {order.payment.total_amount}
                    </p> */}
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs ${
                          order.payment ? "bg-green-200 text-green-800" : ""
                        }`}
                      >
                        {"paid"}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Payment Method:</span>{" "}
                      {order.payment.payment_method}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      {order.payment.email || "N/A"}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-600">
                    No payment information available.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Issued by {business.name}{" "}
                {business.website && (
                  <a
                    href={business.website}
                    className="text-blue-600 hover:underline"
                  >
                    ({business.website})
                  </a>
                )}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Thank you for your business!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { Orders, OrderDetails };
