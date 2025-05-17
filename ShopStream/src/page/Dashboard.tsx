import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../component/Sidebar";
import Topbar from "../component/Topbar";
import API_URL from "../api/api_url";
import StatCardComponent from "../component/StartCard";

const Dashboard = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);

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
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  if (!userData) {
    return (
      <div
        style={{
          padding: "2.5rem",
          color: "#333",
          backgroundColor: "#fff",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "1.25rem",
        }}
      >
        Loading...
      </div>
    );
  }

  const { name, email, profilePicture } = userData;
  const business = userData.businesses;

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#f9f9f9",
        color: "#000",
        overflow: "hidden",
      }}
    >
      <Sidebar />
      <div style={{ flex: 1, minHeight: "100vh", overflowY: "auto" }}>
        <Topbar
          user={{ name, email, profilePicture }}
          business={{
            name: business.name,
            logoUrl: business.logoUrl,
            website: business.website,
          }}
          onLogout={handleLogout}
        />
        <div
          style={{
            padding: "2rem",
            margin: "2rem",
            backgroundColor: "#ffffff",
            borderRadius: "1rem",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          }}
        >
          <h2
            style={{
              fontSize: "1.875rem",
              fontWeight: "700",
              marginBottom: "1.5rem",
            }}
          >
            Welcome to your Dashboard
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.5rem",
            }}
          >
            <StatCardComponent title="New Subscribers" value="1,234" />
            <StatCardComponent title="Total Views" value="12.1M" />
            <StatCardComponent title="Engagement Rate" value="56%" />
            <StatCardComponent title="Daily Visitors" value="1.5K" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
