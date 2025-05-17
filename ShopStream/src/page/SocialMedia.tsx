import React, { useState, useEffect } from "react";
import Sidebar from "../component/Sidebar";
import Topbar from "../component/Topbar";
import { useNavigate } from "react-router-dom";
import API_URL from "../api/api_url";

enum PlatformType {
  FACEBOOK = "facebook",
  INSTAGRAM = "instagram",
  WHATSAPP = "whatsapp",
  TIKTOK = "tiktok",
}

interface SocialPage {
  id: string;
  platform: PlatformType;
  pageId: string;
  pageName: string;
  username?: string;
  profilePictureUrl?: string;
  isActive: boolean;
}

interface Business {
  name: string;
  logoUrl: string;
  website: string;
}

interface UserData {
  name: string;
  email: string;
  profilePicture: string;
  businesses: Business | null;
}

const SocialMediaPage = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [socialPages, setSocialPages] = useState<SocialPage[]>([]);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [fbCode, setFbCode] = useState<string | null>(null);
  const [connectingFb, setConnectingFb] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem("token");
    navigate("/");
  };

  // Fetch user data and social pages
  const fetchUserAndBusiness = async (jwt: string) => {
    setError(null);
    setLoadingUserData(true);
    try {
      const res = await fetch(`${API_URL}auth/profile`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data: UserData = await res.json();
      setUserData(data);

      if (data.businesses == null) {
        navigate("/business-details");
        return;
      }

      const socialRes = await fetch(`${API_URL}auth/facebook/fb-page`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log(socialRes)

      if (!socialRes.ok) throw new Error("Failed to fetch social pages");
      const socialData: SocialPage[] = await socialRes.json();
      setSocialPages(socialData);
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError(err.message || "Error fetching profile");
    } finally {
      setLoadingUserData(false);
    }
  };

  // Initial token check and fetch data
  useEffect(() => {
    const jwt = sessionStorage.getItem("token");
    if (!jwt) {
      navigate("/");
    } else {
      setToken(jwt);
      fetchUserAndBusiness(jwt);
    }
  }, [navigate]);

  // Facebook OAuth connection
  const connectFacebook = () => {
    const FB_APP_ID = "1160645722385502";
    const REDIRECT_URI = "http://localhost:5173/social-media";
    const scopes = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_metadata",
      "pages_messaging",
      "pages_manage_posts",
    ].join(",");

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&scope=${scopes}&response_type=code`;

    window.location.href = authUrl;
  };

  const exchangeCodeForToken = async (code: string) => {
    try {
      const token = sessionStorage.getItem("token");
      console.log(token);
      const res = await fetch("http://localhost:3000/auth/facebook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code, redirectUri: "http://localhost:5173/social-media" }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Facebook Page connected successfully!");
        // Refresh social pages after successful connection
        if (token) fetchUserAndBusiness(token);
      } else {
        alert("Error from backend: " + data.message);
      }
    } catch (err: any) {
      console.error(err);
      alert("Error connecting page: " + err.message);
    }
  };
  // Exchange Facebook code for token
  // const exchangeCodeForToken = async (code: string) => {
  //   const token = sessionStorage.getItem("token");
  //   console.log(token)
  //   // if (!token) {
  //   //   setError("User token missing. Please login again.");
  //   //   return;
  //   // }
  //   // setConnectingFb(true);
  //   // setError(null);
  //   try {
  //     const res = await fetch(`${API_URL}auth/facebook`, {
  //       method: "POST",
  //       headers: {
  //         "ngrok-skip-browser-warning": "true",
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({
  //         code,
  //         redirectUri: "http://localhost:5173/social-media",
  //       }),
  //     });

  //     const data = await res.json();
  //     if (res.ok) {
  //       // Success
  //       await fetchUserAndBusiness(token);
  //     } else {
  //       setError(data.message || "Failed to connect Facebook page");
  //     }
  //   } catch (err: any) {
  //     console.error(err);
  //     setError(err.message || "Error connecting Facebook page");
  //   } finally {
  //     setConnectingFb(false);
  //   }
  // };

  // Parse Facebook OAuth code from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      setFbCode(code);
      exchangeCodeForToken(code);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (loadingUserData) {
    return <div className="p-10">Loading user data...</div>;
  }

  if (!userData) {
    return (
      <div className="p-10 text-red-600">
        Unable to load user data. Please login again.
      </div>
    );
  }

  const { name, email, profilePicture, businesses: business } = userData;

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

        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Social Media Pages</h2>
            <button
              onClick={connectFacebook}
              disabled={connectingFb}
              className={`px-6 py-3 rounded text-white ${
                connectingFb
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {connectingFb ? "Connecting..." : "Connect Facebook Page"}
            </button>
          </div>

          {error && (
            <div className="mb-4 text-red-600 font-semibold">{error}</div>
          )}

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Page Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profile Picture
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {socialPages.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No social pages connected
                    </td>
                  </tr>
                ) : (
                  socialPages.map((page) => (
                    <tr key={page.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {page.platform}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {page.pageName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {page.username || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {page.profilePictureUrl ? (
                          <img
                            src={page.profilePictureUrl}
                            alt={page.pageName}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            page.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {page.isActive ? "Active" : "Inactive"}
                        </span>
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

export default SocialMediaPage;
