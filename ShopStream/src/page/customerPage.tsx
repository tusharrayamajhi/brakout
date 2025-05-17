import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../component/Sidebar";
import Topbar from "../component/Topbar";
import API_URL from "../api/api_url";

interface Customer {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  socialPage?: {
    pageName: string;
  };
}

const CustomerPage = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

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

      if (!data.businesses) {
        navigate("/business-details");
      } else {
        const customerRes = await fetch(`${API_URL}customers`, {
          headers: {
            "ngrok-skip-browser-warning": "true",
            Authorization: `Bearer ${token}`,
          },
        });

        const customerData = await customerRes.json();
        setCustomers(customerData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!userData || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-black">
        Loading...
      </div>
    );
  }

  const { name, email, profilePicture } = userData;
  const business = userData.businesses;

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-white text-black">
      <Sidebar />
      <div className="flex-1 min-h-screen bg-white">
        <Topbar
          user={{ name, email, profilePicture }}
          business={{
            name: business.name,
            logoUrl: business.logoUrl,
            website: business.website,
          }}
          onLogout={handleLogout}
        />
        <div className="p-8">
          <h2 className="text-2xl font-semibold mb-6">Customer Dashboard</h2>

          <div className="bg-white shadow border rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {[
                    "ID",
                    "Full Name",
                    "Email",
                    "Social Page",
                    "Created At",
                    "Updated At",
                  ].map((title) => (
                    <th
                      key={title}
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No customers found
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {customer.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {customer.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {customer.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {customer.socialPage?.pageName || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(customer.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPage;
