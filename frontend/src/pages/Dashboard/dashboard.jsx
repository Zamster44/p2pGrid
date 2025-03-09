import React from "react";
import { Link , useNavigate } from "react-router-dom";
import { useState } from "react";

const Dashboard = () => {
    const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate()
    const onLogout = () => {
      localStorage.clear();
      navigate("/login")
    }

  return (
    <div>
      <div className="flex justify-end p-2 text-xl cursor-pointer ">
        <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="text-[#00AAFF]"
        >
            MY PROFILE
        </button>
        {isOpen && (
        <div className="absolute right-2 mt-10 w-48 bg-[#D9D9D9] border rounded-lg shadow-lg">
          <div className="p-2 space-y-2">
            <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                <Link to={"/profile"}>Profile</Link>
            </div>
            <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                <Link to={"/sellerForm"}>Seller </Link>
            </div>
            <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                <button onClick={onLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
      </div>
      <hr className="border-t-1 border-black mx-2" />

      <div className="mt-10 flex items-center justify-center w-full">
        <table className="w-full max-w-4xl text-sm text-left rtl:text-right border-collapse border border-black">
          <thead className="text-xs uppercase bg-gray-100">
            <tr className="border-b border-black">
              <th scope="col" className="px-6 py-3 border-r border-black">
                Provider name
              </th>
              <th scope="col" className="px-6 py-3">
                Price
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black">
              <th scope="row" className="px-6 py-4 font-medium border-r border-black">
                SIDDHART KUMAR
              </th>
              <td className="px-6 py-4">1.5 Unit/Rupee</td>
            </tr>
            <tr className="border-b border-black">
              <th scope="row" className="px-6 py-4 font-medium border-r border-black">
                Aryan Patel
              </th>
              <td className="px-6 py-4">1.75 Unit/Rupee</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
