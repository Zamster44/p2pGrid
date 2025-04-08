import React, { useState, useEffect } from "react";

const Profile = () => {
  // Existing state and logic remains unchanged
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetch("http://localhost:8000/current-user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.message);
        }

        setUser(data.user);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl font-semibold text-[#00AAFF]">
          Loading Profile...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500 text-lg font-medium p-4 bg-white rounded-lg shadow-md">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#00AAFF] mb-8">Profile Overview</h1>
        
        {/* Profile Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-[#00AAFF]/20">
            <h2 className="text-xl font-semibold text-[#00AAFF]">My Profile</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Username</label>
              <p className="text-lg font-semibold text-gray-800">{user.fullName}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Seller Status</label>
              <p className={`text-lg font-semibold ${user.seller ? 'text-green-600' : 'text-gray-800'}`}>
                {user.seller ? "Verified Seller" : "Standard Account"}
              </p>
            </div>
          </div>
        </div>

        {/* Wallet Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-[#00AAFF]/20">
            <h2 className="text-xl font-semibold text-[#00AAFF]">Wallet Balance</h2>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Available Balance</label>
              <p className="text-2xl font-bold text-gray-800">
                {user.balance?.toFixed(2) || '0.00'} ETH
              </p>
            </div>
            <div className="bg-[#00AAFF]/10 p-3 rounded-lg">
              <span className="text-[#00AAFF] text-lg">💳</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;