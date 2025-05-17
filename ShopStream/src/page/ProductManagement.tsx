import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../component/Sidebar";
import Topbar from "../component/Topbar";
import API_URL from "../api/api_url";

interface Product {
  id: string;
  productName: string;
  description: string;
  price: string;
  stock: number;
  imageUrl: string;
  videoLink?: string;
  color: string;
  size: string[];
  gender: string;
  season?: string;
}

const ProductPage = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string>("");
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);

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

      if (data.businesses == null) {
        navigate("/business-details");
      } else {
        fetchProducts(token);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const fetchProducts = async (token: string) => {
    setLoadingProducts(true);
    try {
      const response = await axios.get(`${API_URL}products`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          Authorization: `Bearer ${token}`,
        },
      });
      const productArray = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.products)
        ? response.data.products
        : [];

      setProducts(productArray);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddProduct = () => {
    navigate("/add-product");
  };

  const handleEditProduct = (productId: string) => {
    navigate(`/edit-product/${productId}`);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!token) {
      setError("Authentication token missing.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`${API_URL}products/${productId}`, {
          headers: {
            "ngrok-skip-browser-warning": "true",
            Authorization: `Bearer ${token}`,
          },
        });
        setProducts(products.filter((product) => product.id !== productId));
      } catch (err) {
        console.error("Error deleting product:", err);
        setError("Failed to delete product.");
      }
    }
  };

  if (!userData) {
    return (
      <div className="p-10 text-black bg-white min-h-screen">Loading...</div>
    );
  }

  const { name, email, profilePicture } = userData;
  const business = userData.businesses;

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-white text-black">
      <Sidebar />
      <div className="flex-1 min-h-screen flex flex-col">
        <Topbar
          user={{ name, email, profilePicture }}
          business={{
            name: business?.name || "No Business",
            logoUrl: business?.logoUrl,
            website: business?.website,
          }}
          onLogout={handleLogout}
        />
        <main className="m-8 p-8 mt-6 bg-white rounded-xl border border-gray-300 shadow-md flex-1 overflow-auto">
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-3xl font-semibold tracking-wide text-gray-900">Products</h2>
    <button
      onClick={handleAddProduct}
      className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition duration-200"
      aria-label="Add Product"
    >
      Add Product
    </button>
  </div>

  {error && (
    <p className="text-red-600 mb-4" role="alert">{error}</p>
  )}

  {loadingProducts ? (
    <div className="text-center py-10 text-gray-700">Loading products...</div>
  ) : (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] border border-gray-300 rounded-lg shadow-sm table-auto">
        <thead className="bg-gray-100 border-b border-gray-300">
          <tr>
            {/* table headers */}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Image</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider max-w-[150px] truncate">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider max-w-[250px] truncate">Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Price</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Stock</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Color</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Size</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Gender</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Season</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Video</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="px-4 py-2">
                <img src={product.imageUrl} alt={product.productName} className="w-16 h-16 object-cover rounded" />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-[150px] truncate">{product.productName}</td>
              <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 max-w-[250px] truncate">{product.description}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.price}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.stock}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.color}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.size.join(", ")}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.gender}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.season || "-"}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                {product.videoLink ? (
                  <a
                    href={product.videoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    aria-label={`View video for ${product.productName}`}
                  >
                    View
                  </a>
                ) : (
                  "-"
                )}
              </td>
              <td className="px-4 py-2 flex space-x-2">
                <button
                  onClick={() => handleEditProduct(product.id)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  aria-label={`Edit ${product.productName}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  aria-label={`Delete ${product.productName}`}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</main>

      </div>
    </div>
  );
};

export default ProductPage;
