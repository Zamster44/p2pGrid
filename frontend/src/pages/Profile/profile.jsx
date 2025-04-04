import React, { useState, useEffect } from "react";

const Profile = () => {
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
    return <div className="flex justify-center p-2 text-xl text-[#00AAFF]">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center p-2 text-xl text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex justify-center p-2 text-xl text-[#00AAFF]">PROFILE</div>
      <hr className="border-t-1 border-black mx-2" />
      <div className="mt-10 p-2">
        <div className="flex p-2 text-xl text-[#00AAFF]">MY PROFILE</div>
        <hr className="border-t-1 border-black mx-2 mr-[500px]" />
        <div className="flex gap-60 p-2 text-base">
          <div>Username: {user.fullName}</div>
          <div>Seller Status: {user.seller ? "True" : "False"}</div>
        </div>
      </div>

      <div className="mt-10 p-2">
        <div className="flex p-2 text-xl text-[#00AAFF]">Wallet</div>
        <hr className="border-t-1 border-black mx-2 mr-[500px]" />
        <div className="flex gap-80 p-2 text-base">
          <div>Balance: {user.balance}</div>
        </div>
      </div>
    </div>
  );
};

export default Profile;