import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Search } from "lucide-react";

interface TopbarProps {
  user: {
    name: string;
    email: string;
    profilePicture: string;
  };
  business: {
    name: string;
    logoUrl: string;
    website: string;
  };
  onLogout: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ user, business, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const businessDetails = () => {
    navigate("/business");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Add your search logic here if needed
  };

  return (
    <div className="flex justify-between items-center p-4 bg-white text-black border-b border-gray-300 shadow-md">
      {/* Business Info */}
      <div
        className="flex items-center space-x-4 cursor-pointer"
        onClick={businessDetails}
      >
        <img
          src={business.logoUrl}
          alt="Business Logo"
          className="w-12 h-12 rounded-full border-2 border-black"
        />
        <div>
          <h1 className="text-xl font-extrabold tracking-wide text-black">
            {business.name}
          </h1>
          <a
            href={business.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-700 hover:text-black underline"
            onClick={(e) => e.stopPropagation()}
          >
            {business.website}
          </a>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-gray-100 rounded-md px-3 py-2 max-w-md w-full mx-8">
        <Search className="w-5 h-5 text-gray-600" />
        <input
          type="text"
          placeholder="Search products, categories..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="ml-2 bg-transparent outline-none w-full text-black placeholder-gray-500"
        />
      </div>

      {/* User Profile + Dropdown */}
      <div className="relative flex items-center space-x-1" ref={dropdownRef}>
        <img
          src={user.profilePicture}
          alt="User Profile"
          className="w-11 h-11 rounded-full border-2 border-black cursor-pointer hover:border-gray-800 transition"
          onClick={() => setDropdownOpen((open) => !open)}
          title="User Profile"
        />
        <button
          onClick={() => setDropdownOpen((open) => !open)}
          aria-label="Toggle profile menu"
          className="text-black hover:text-gray-800 focus:outline-none"
        >
          <ChevronDown
            className={`w-5 h-5 transition-transform duration-200 ${
              dropdownOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-10 mt-3 w-60 bg-white rounded-lg shadow-lg border border-gray-300 z-50">
            <div className="p-4 border-b border-gray-200">
              <p className="font-semibold text-black truncate">{user.name}</p>
              <p className="text-sm text-gray-600 truncate">{user.email}</p>
            </div>
            <button
              onClick={businessDetails}
              className="w-full cursor-pointer text-left px-4 py-3 hover:bg-gray-100 transition text-gray-800"
            >
              Business Settings
            </button>
            <button
              onClick={onLogout}
              className="w-full cursor-pointer text-left px-4 py-3 hover:bg-red-100 transition text-red-600 font-semibold"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Topbar;
