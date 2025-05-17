import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../component/Sidebar";
import Topbar from "../component/Topbar";
import API_URL from "../api/api_url";

enum Size {
  XS = "XS",
  S = "S",
  M = "M",
  L = "L",
  XL = "XL",
  XXL = "XXL",
  FREE_SIZE = "Free Size",
}

enum Gender {
  MEN = "Men",
  WOMEN = "Women",
  UNISEX = "Unisex",
  CHILDREN = "Children",
}

interface User {
  name: string;
  email: string;
  profilePicture: string;
  businesses?: {
    name: string;
    logoUrl: string;
    website: string;
  };
}

const AddProductPage = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    productName: "",
    description: "",
    price: "",
    stock: 0,
    imageUrl: "",
    videoLink: "",
    color: "",
    size: [] as Size[],
    gender: "" as Gender | "",
    season: "",
  });

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    navigate("/");
  };

  const fetchUserAndBusiness = useCallback(
    async (token: string) => {
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
    },
    [navigate]
  );

  useEffect(() => {
    const jwt = sessionStorage.getItem("token");
    if (!jwt) {
      navigate("/");
    } else {
      setToken(jwt);
      fetchUserAndBusiness(jwt);
    }
  }, [navigate, fetchUserAndBusiness]);

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "stock" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSizeChange = (size: Size) => {
    setFormData((prev) => ({
      ...prev,
      size: prev.size.includes(size)
        ? prev.size.filter((s) => s !== size)
        : [...prev.size, size],
    }));
  };

  const validateForm = () => {
    if (
      !formData.productName ||
      !formData.description ||
      !formData.price ||
      !formData.imageUrl ||
      !formData.color ||
      !formData.size.length
    ) {
      setError("Please fill all required fields.");
      return false;
    }
    return true;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    try {
      const response = await fetch(`${API_URL}products`, {
        method: "POST",
        headers: {
          "ngrok-skip-browser-warning": "true",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add product.");
      }

      setSuccess("Product added successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error("Error adding product:", err);
      setError(err.message || "Failed to add product.");
    }
  };

  if (!userData) return <div className="p-10">Loading...</div>;

  const { name, email, profilePicture, businesses } = userData;

  return (
    <div className="flex w-screen h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 min-h-screen flex flex-col">
        <Topbar
          user={{ name, email, profilePicture }}
          business={{
            name: businesses?.name || "Business Name",
            logoUrl: businesses?.logoUrl || "",
            website: businesses?.website || "#",
          }}
          onLogout={handleLogout}
        />
        <main className="flex-grow p-8 flex justify-center items-start">
          <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-5xl">
            <h2 className="text-3xl font-semibold mb-8 text-gray-800">
              Add New Product
            </h2>

            {error && (
              <p className="text-red-600 mb-6 bg-red-100 p-3 rounded border border-red-300">
                {error}
              </p>
            )}
            {success && (
              <p className="text-green-700 mb-6 bg-green-100 p-3 rounded border border-green-300">
                {success}
              </p>
            )}

            <form
              onSubmit={handleFormSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {[
                {
                  label: "Product Name *",
                  name: "productName",
                  type: "text",
                  placeholder: "Enter product name",
                },
                {
                  label: "Price *",
                  name: "price",
                  type: "text",
                  placeholder: "Enter price in USD",
                },
                {
                  label: "Stock *",
                  name: "stock",
                  type: "number",
                  placeholder: "Available stock",
                },
                {
                  label: "Image URL *",
                  name: "imageUrl",
                  type: "text",
                  placeholder: "https://example.com/image.jpg",
                },
                {
                  label: "Video Link",
                  name: "videoLink",
                  type: "text",
                  placeholder: "Optional: Video URL",
                },
                {
                  label: "Color *",
                  name: "color",
                  type: "text",
                  placeholder: "e.g. Red, Blue",
                },
                {
                  label: "Season",
                  name: "season",
                  type: "text",
                  placeholder: "e.g. Summer, Winter",
                },
              ].map(({ label, name, type, placeholder }) => (
                <div key={name} className="flex flex-col">
                  <label
                    htmlFor={name}
                    className="mb-2 font-medium text-gray-700"
                  >
                    {label}
                  </label>
                  <input
                    type={type}
                    id={name}
                    name={name}
                    value={(formData as any)[name]}
                    onChange={handleFormChange}
                    placeholder={placeholder}
                    className="border border-gray-300 rounded-md p-2 transition focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    required={label.includes("*")}
                    min={type === "number" ? 0 : undefined}
                  />
                </div>
              ))}

              <div className="flex flex-col">
                <label
                  htmlFor="gender"
                  className="mb-2 font-medium text-gray-700"
                >
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleFormChange}
                  className="border border-gray-300 rounded-md p-3 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Gender</option>
                  {Object.values(Gender).map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 flex flex-col">
                <label
                  htmlFor="description"
                  className="mb-2 font-medium text-gray-700"
                >
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={4}
                  placeholder="Write a detailed description about the product"
                  className="border border-gray-300 rounded-md p-3 resize-none transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2 flex flex-col">
                <label className="mb-2 font-medium text-gray-700">Size *</label>
                <div className="flex flex-wrap gap-4">
                  {Object.values(Size).map((s) => (
                    <label
                      key={s}
                      className="flex items-center cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={formData.size.includes(s)}
                        onChange={() => handleSizeChange(s)}
                        className="mr-2 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-md shadow-md hover:bg-blue-700 transition"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddProductPage;
