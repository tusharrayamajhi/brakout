import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../component/Sidebar";
import Topbar from "../component/Topbar";
import useAuth from "../hooks/useAuth";
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

interface Product {
  productName: string;
  description: string;
  price: string;
  stock: number;
  imageUrl: string;
  videoLink?: string;
  color: string;
  size: Size[];
  gender?: Gender;
  season?: string;
}

const EditProductPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Get product ID from URL
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [formData, setFormData] = useState<Product>({
    productName: "",
    description: "",
    price: "",
    stock: 0,
    imageUrl: "",
    videoLink: "",
    color: "",
    size: [],
    gender: undefined,
    season: "",
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
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
      console.log(data);
      setUserData(data);

      if (data.businesses == null) {
        navigate("/business-details");
      } else {
        fetchProduct(token, data.businesses.id);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load user data.");
      setLoading(false);
    }
  };

  const fetchProduct = async (token: string, businessId) => {
    try {
      const res = await fetch(
        `${API_URL}products/${id}?businessId=${businessId}`,
        {
          headers: {
            "ngrok-skip-browser-warning": "true",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(res);
      if (!res.ok) {
        throw new Error("Failed to fetch product.");
      }
      const data = await res.json();
      console.log(data);
      setFormData({
        productName: data.productName || "",
        description: data.description || "",
        price: data.price || "",
        stock: data.stock || 0,
        imageUrl: data.imageUrl || "",
        videoLink: data.videoLink || "",
        color: data.color || "",
        size: data.size || [],
        gender: data.gender || "",
        season: data.season || "",
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching product:", err);
      setError("Failed to load product data.");
      setLoading(false);
    }
  };

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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (
        !formData.productName ||
        !formData.description ||
        !formData.price ||
        !formData.imageUrl ||
        !formData.color ||
        !formData.size.length
      ) {
        setError("Please fill all required fields.");
        return;
      }

      const response = await fetch(`${API_URL}products/${id}`, {
        method: "PATCH",
        headers: {
          "ngrok-skip-browser-warning": "true",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update product.");
      }

      setSuccess("Product updated successfully!");
      setError("");
      setTimeout(() => {
        navigate("/products"); // Redirect to products list
      }, 2000);
    } catch (err: any) {
      console.error("Error updating product:", err);
      setError(err.message || "Failed to update product.");
    }
  };

  if (!userData || loading) {
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
        <div className="p-8">
          <h2 className="text-2xl font-semibold mb-6">Edit Product</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {success && (
            <p className="text-green-500 mb-4 bg-green-100 p-2 rounded">
              {success}
            </p>
          )}
          <form
            onSubmit={handleFormSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl"
          >
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Product Name *
              </label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleFormChange}
                className="mt-1 p-2 w-full border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Price *
              </label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleFormChange}
                className="mt-1 p-2 w-full border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Stock *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleFormChange}
                className="mt-1 p-2 w-full border rounded"
                min="0"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Image URL *
              </label>
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleFormChange}
                className="mt-1 p-2 w-full border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Video Link
              </label>
              <input
                type="text"
                name="videoLink"
                value={formData.videoLink}
                onChange={handleFormChange}
                className="mt-1 p-2 w-full border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Color *
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleFormChange}
                className="mt-1 p-2 w-full border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleFormChange}
                className="mt-1 p-2 w-full border rounded"
              >
                <option value="">Select Gender</option>
                {Object.values(Gender).map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Season
              </label>
              <input
                type="text"
                name="season"
                value={formData.season}
                onChange={handleFormChange}
                className="mt-1 p-2 w-full border rounded"
              />
            </div>
            <div className="mb-4 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                className="mt-1 p-2 w-full border rounded"
                rows={4}
                required
              />
            </div>
            <div className="mb-4 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Size *
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.values(Size).map((size) => (
                  <label key={size} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.size.includes(size)}
                      onChange={() => handleSizeChange(size)}
                      className="mr-2"
                    />
                    {size}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-4 md:col-span-2">
              <button
                type="button"
                onClick={() => navigate("/products")}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProductPage;
