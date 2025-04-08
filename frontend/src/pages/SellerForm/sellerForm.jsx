import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axoisInstance from "../../utils/axoisInstance";
import { validateEmail } from "../../utils/helper";

const SellerForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    price: "",
    espId: "",
    currentStateOfCharge: "",
    energyQuota: ""
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axoisInstance.get("/current-user");
        const user = response.data.user;
        setCurrentUser(user);
        
        if (user.seller) {
          setIsEditMode(true);
          fetchSellerData(user.email);
        } else {
          // Pre-fill email if user is not a seller yet
          setFormData(prev => ({
            ...prev,
            email: user.email,
            fullName: user.fullName
          }));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const fetchSellerData = async (email) => {
    setIsLoading(true);
    try {
      const response = await axoisInstance.get(`/seller-by-email/${email}`);
      if (response.data.seller) {
        const seller = response.data.seller;
        setFormData({
          fullName: seller.fullName,
          email: seller.email,
          price: seller.price,
          espId: seller.espId,
          currentStateOfCharge: seller.currentStateOfCharge,
          energyQuota: seller.energyQuota
        });
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch seller data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email");
      return;
    }

    if (!formData.fullName) {
      setError("Please enter Your Name");
      return;
    }
    if (!formData.price) {
      setError("Please enter Price");
      return;
    }
    if (!formData.espId) {
      setError("Please enter Your Esp Id");
      return;
    }
    if (!formData.currentStateOfCharge) {
      setError("Please enter Current State Of Charge");
      return;
    }
    if (!formData.energyQuota) {
      setError("Please enter Energy Quota");
      return;
    }

    try {
      setIsLoading(true);
      if (isEditMode) {
        // Update existing seller
        await axoisInstance.put(`/update-seller/${formData.email}`, {
          fullName: formData.fullName,
          price: formData.price,
          espId: formData.espId,
          currentStateOfCharge: formData.currentStateOfCharge,
          energyQuota: formData.energyQuota
        });
      } else {
        // Create new seller
        await axoisInstance.post("/addSellerForm", {
          email: formData.email,
          fullName: formData.fullName,
          price: formData.price,
          espId: formData.espId,
          currentStateOfCharge: formData.currentStateOfCharge,
          energyQuota: formData.energyQuota
        });
      }
      navigate("/dashboard");
    } catch (error) {
      setError(error.response?.data?.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen bg-gray-50 text-[#00AAFF] text-3xl font-bold">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-8">
        <h1 className="text-3xl font-bold text-[#00AAFF] text-center mb-8">
          {isEditMode ? "Update Seller Profile" : "Become an Energy Seller"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Full Name
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00AAFF] focus:border-transparent transition-all"
                  type="text"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Price (WH/Rupee)
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00AAFF] focus:border-transparent transition-all"
                  type="text"
                  name="price"
                  placeholder="Enter price per unit"
                  value={formData.price}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  ESP Device ID
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00AAFF] focus:border-transparent transition-all"
                  type="text"
                  name="espId"
                  placeholder="Enter device ID"
                  value={formData.espId}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Email
                </label>
                <input
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00AAFF] focus:border-transparent transition-all ${
                    isEditMode ? "bg-gray-100" : ""
                  }`}
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  readOnly={isEditMode}
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  State of Charge (%)
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00AAFF] focus:border-transparent transition-all"
                  type="text"
                  name="currentStateOfCharge"
                  placeholder="Enter current charge state"
                  value={formData.currentStateOfCharge}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Energy Quota (WH)
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00AAFF] focus:border-transparent transition-all"
                  type="text"
                  name="energyQuota"
                  placeholder="Enter energy quota"
                  value={formData.energyQuota}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="mt-10">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
                isLoading
                  ? "bg-[#00AAFF]/70 cursor-not-allowed"
                  : "bg-[#00AAFF] hover:bg-[#0095e0]"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isEditMode ? "Updating..." : "Submitting..."}
                </div>
              ) : isEditMode ? (
                "Update Profile"
              ) : (
                "Become a Seller"
              )}
            </button>

            {error && (
              <p className="text-red-500 text-sm text-center mt-4">{error}</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerForm;