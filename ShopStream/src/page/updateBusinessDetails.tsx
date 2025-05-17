import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../component/Sidebar";
import Topbar from "../component/Topbar";
import API_URL from "../api/api_url";

const BusinessDetailsUpdate = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    website: "",
    address: "",
    logoUrl: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

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
      fetchProfile(jwt);
    }
  }, [navigate]);

  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });

      const data = await res.json();
      setUserData(data);
      const business = data.businesses;

      if (business?.id) {
        setBusinessId(business.id);
      }

      setForm({
        name: business?.name || "",
        email: business?.email || "",
        phoneNumber: business?.phoneNumber || "",
        website: business?.website || "",
        address: business?.address || "",
        logoUrl: business?.logoUrl || "",
        description: business?.description || "",
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage("");

    if (!businessId) {
      setStatusMessage("Business ID not found. Cannot update.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}businesses/${businessId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatusMessage("Business details updated successfully!");
      } else {
        const error = await res.json();
        setStatusMessage(`Error: ${error.message || "Failed to update"}`);
      }
    } catch (err) {
      console.error("Update error:", err);
      setStatusMessage("Error updating business details.");
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading...</div>;
  }

  const { name, email, profilePicture } = userData || {};
  const business = userData?.businesses;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, overflowY: "auto" }}>
        <Topbar
          user={{ name, email, profilePicture }}
          business={{
            name: business?.name,
            logoUrl: business?.logoUrl,
            website: business?.website,
          }}
          onLogout={handleLogout}
        />
        <div
          style={{
            padding: "2rem",
            maxWidth: "800px",
            margin: "2rem auto",
            backgroundColor: "#fff",
            borderRadius: "1rem",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", fontWeight: "600" }}>
            Update Business Details
          </h2>
          {statusMessage && (
            <div style={{ marginBottom: "1rem", color: "green" }}>{statusMessage}</div>
          )}
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {["name", "email", "phoneNumber", "website", "address", "logoUrl"].map((field) => (
              <input
                key={field}
                type="text"
                name={field}
                placeholder={field.replace(/([A-Z])/g, " $1")}
                value={form[field as keyof typeof form]}
                onChange={handleChange}
                style={{
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #ccc",
                  fontSize: "1rem",
                }}
              />
            ))}
            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              style={{
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #ccc",
                fontSize: "1rem",
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: "#3b82f6",
                color: "#fff",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "none",
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              Update Business
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetailsUpdate;
