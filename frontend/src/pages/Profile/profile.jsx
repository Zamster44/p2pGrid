import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; // Correct import

const Profile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decoded = jwtDecode(token); // Decode JWT correctly
        setUser(decoded.user); // Extract user data
      } catch (error) {
        console.error("Invalid token:", error);
      }
    }
  }, []);

  if (!user) {
    return <div className="flex justify-center p-2 text-xl text-[#00AAFF]">Loading...</div>;
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
          <div>Balance: 1000</div>
          <div className="text-[#00AAFF]">+ADD MONEY</div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
