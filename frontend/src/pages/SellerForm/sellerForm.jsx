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
      setError("Please enter Unit Number");
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
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-center p-2 text-xl text-[#00AAFF]">
        {isEditMode ? "Edit Seller Form" : "Seller Form"}
      </div>
      <hr className="border-t-1 border-black mx-2" />
      <form onSubmit={handleSubmit}>
        <div className="flex justify-center gap-20 mt-10">
          <div className="flex flex-col gap-3">
            <div className="m-5">
              <div className="text-lg">Name</div>
              <input
                className="border border-black rounded-md w-80 p-1"
                type="text"
                name="fullName"
                placeholder="Name"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>

            <div className="m-5">
              <div className="text-lg">Price</div>
              <input
                className="border border-black rounded-md w-80 p-1"
                type="text"
                name="price"
                placeholder="Price"
                value={formData.price}
                onChange={handleChange}
              />
            </div>

            <div className="m-5">
              <div className="text-lg">Esp Id</div>
              <input
                className="border border-black rounded-md w-80 p-1"
                type="text"
                name="espId"
                placeholder="Id"
                value={formData.espId}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="m-5">
              <div className="text-lg">Email</div>
              <input
                className={`border border-black rounded-md w-80 p-1 ${isEditMode ? "bg-gray-200" : ""}`}
                type="text"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                readOnly={isEditMode}
              />
            </div>
            <div className="m-5">
              <div className="text-lg">Current State Of Charge</div>
              <input
                className="border border-black rounded-md w-80 p-1"
                type="text"
                name="currentStateOfCharge"
                placeholder="Current State Of Charge"
                value={formData.currentStateOfCharge}
                onChange={handleChange}
              />
            </div>

            <div className="m-5">
              <div className="text-lg">Energy Quota</div>
              <input
                className="border border-black rounded-md w-80 p-1"
                type="text"
                name="energyQuota"
                placeholder="Energy Quota"
                value={formData.energyQuota}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center mt-20">
          <button 
            className="w-80 h-10 bg-[#00AAFF] text-white rounded-md"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : isEditMode ? "Update" : "Submit"}
          </button>
        </div>
        {error && (
          <div className="flex justify-center items-center">
            <p className="text-red-500 text-base mt-5 mx-auto">{error}</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default SellerForm;