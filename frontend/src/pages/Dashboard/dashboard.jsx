import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Modal, Box, Button, Typography } from "@mui/material";
import axoisInstance from "../../utils/axoisInstance";

const Dashboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [chargeAmount, setChargeAmount] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sellers
        const sellersResponse = await axoisInstance.get("/getSellers");
        setSellers(sellersResponse.data.sellers);

        // Fetch current user data
        const userResponse = await axoisInstance.get("/current-user");
        setCurrentUser(userResponse.data.user);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const navigate = useNavigate();
  const onLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleSellerClick = (seller) => {
    setSelectedSeller(seller);
    setIsModalOpen(true);
  };

  const handleBuy = async () => {
    try {

      const response = await axoisInstance.post("/trade", {
        sellerEmail: selectedSeller.email,
        amount: selectedSeller.price
      });

      alert(`Trade successful! TX Hash: ${response.data.transactionHash}`);
      setIsModalOpen(false);
      setChargeAmount("");
    } catch (error) {
      console.error("Trade failed:", error);
      alert("Trade failed: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div>
      <div className="flex justify-end p-2 text-xl cursor-pointer">
        <button onClick={() => setIsOpen(!isOpen)} className="text-[#00AAFF]">
          MY PROFILE
        </button>
        {isOpen && (
          <div className="absolute right-2 mt-10 w-60 bg-[#D9D9D9] border rounded-lg shadow-lg">
            <div className="p-2 space-y-2">
              <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                <Link to={"/profile"}>Profile</Link>
              </div>
              {currentUser?.seller ? (
                <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <Link to={"/sellerForm"}>Edit Seller Form</Link>
                </div>
              ) : (
                <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <Link to={"/sellerForm"}>Add Seller Form</Link>
                </div>
              )}
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
            {sellers.map((seller) => (
              <tr key={seller._id} className="border-b border-black">
                <th
                  scope="row"
                  className="px-6 py-4 font-medium border-r border-black"
                >
                  <button onClick={() => handleSellerClick(seller)}>
                    {seller.fullName}
                  </button>
                </th>
                <td className="px-6 py-4">{seller.price} Unit/Rupee</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "white",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            textAlign: "center",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
            INFORMATION
          </Typography>
          {selectedSeller && (
            <>
              <Typography sx={{ mb: 1 }}>
                <b>NAME:</b> {selectedSeller.fullName}
              </Typography>
              <Typography sx={{ mb: 3 }}>
                <b>PRICE:</b> {selectedSeller.price} UNIT/RUPEE
              </Typography>
            </>
          )}

          <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
            <Button
              variant="contained"
              sx={{ bgcolor: "#00AAFF", color: "white" }}
              onClick={handleBuy}
            >
              BUY
            </Button>
            <Button variant="outlined" onClick={() => setIsModalOpen(false)}>
              CLOSE
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default Dashboard;