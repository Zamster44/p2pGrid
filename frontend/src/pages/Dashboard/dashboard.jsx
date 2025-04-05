import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Modal,
  Box,
  Button,
  Typography,
  LinearProgress,
  CircularProgress,
} from "@mui/material";
import axoisInstance from "../../utils/axoisInstance";

const Dashboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [transactionState, setTransactionState] = useState({
    hash: "",
    progress: 0,
    showSuccess: false,
    showProgress: false,
    activeTransfer: false,
  });
  const [ws, setWs] = useState(null);

  // WebSocket Management
  useEffect(() => {
    const websocket = new WebSocket("ws://localhost:8000");

    websocket.onopen = () => {
      console.log("WebSocket connected");
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message:", data);

        const progress = (data.energy / data.target) * 100;
        console.log(progress);
        setTransactionState((prev) => ({
          ...prev,
          progress: Math.min(progress, 100),
          showProgress: progress < 100 ? true : prev.showProgress,
        }));

        if (progress >= 100) {
          setTimeout(() => {
            setTransactionState((prev) => ({
              ...prev,
              showProgress: false,
              activeTransfer: false,
            }));
          }, 3000);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    websocket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, []);

  // Subscription Management
  useEffect(() => {
    if (ws && selectedSeller?.espId) {
      const subscribeMessage = JSON.stringify({
        type: "subscribe",
        espId: selectedSeller.espId,
      });

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(subscribeMessage);
      } else {
        ws.addEventListener("open", () => ws.send(subscribeMessage));
      }

      return () => {
        const unsubscribeMessage = JSON.stringify({
          type: "unsubscribe",
          espId: selectedSeller.espId,
        });
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(unsubscribeMessage);
        }
      };
    }
  }, [selectedSeller, ws]);

  // Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sellersRes, userRes] = await Promise.all([
          axoisInstance.get("/getSellers"),
          axoisInstance.get("/current-user"),
        ]);
        setSellers(sellersRes.data.sellers);
        setCurrentUser(userRes.data.user);
      } catch (error) {
        console.error("Data fetch error:", error);
        alert("Failed to load data. Please refresh the page.");
      }
    };
    fetchData();
  }, []);

  const navigate = useNavigate();

  // Transaction Handling
  const handleBuy = async () => {
    try {
      setTransactionState({
        hash: "",
        progress: 0,
        showSuccess: true,
        showProgress: false,
        activeTransfer: true,
      });

      const response = await axoisInstance.post("/trade", {
        sellerEmail: selectedSeller.email,
        amount: selectedSeller.price,
      });

      setTransactionState((prev) => ({
        ...prev,
        hash: response.data.transactionHash,
      }));

      setTimeout(() => {
        setTransactionState((prev) => ({
          ...prev,
          showSuccess: false,
          showProgress: true,
        }));
      }, 5000);
    } catch (error) {
      console.error("Transaction error:", error);
      setTransactionState((prev) => ({
        ...prev,
        showSuccess: false,
        showProgress: false,
        activeTransfer: false,
      }));
      alert(
        `Transaction failed: ${error.response?.data?.message || error.message}`
      );
    }
  };

  return (
    <div>
      {/* Profile Dropdown */}
      <div className="flex justify-end p-2 text-xl cursor-pointer">
        <button onClick={() => setIsOpen(!isOpen)} className="text-[#00AAFF]">
          MY PROFILE
        </button>
        {isOpen && (
          <div className="absolute right-2 mt-10 w-60 bg-[#D9D9D9] border rounded-lg shadow-lg">
            <div className="p-2 space-y-2">
              <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                <Link to="/profile">Profile</Link>
              </div>
              {currentUser?.seller ? (
                <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <Link to="/sellerForm">Edit Seller Form</Link>
                </div>
              ) : (
                <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <Link to="/sellerForm">Add Seller Form</Link>
                </div>
              )}
              <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                <button
                  onClick={() => {
                    localStorage.clear();
                    navigate("/");
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <hr className="border-t-1 border-black mx-2" />

      {/* Sellers Table */}
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
                  <button
                    onClick={() => setSelectedSeller(seller)}
                    className="hover:text-[#00AAFF]"
                  >
                    {seller.fullName}
                  </button>
                </th>
                <td className="px-6 py-4">{seller.price} WH/Rupee</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <Modal open={!!selectedSeller} onClose={() => setSelectedSeller(null)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
            SELLER INFORMATION
          </Typography>
          {selectedSeller && (
            <>
              <Typography sx={{ mb: 1 }}>
                <b>Name:</b> {selectedSeller.fullName}
              </Typography>
              <Typography sx={{ mb: 1 }}>
                <b>Price:</b> {selectedSeller.price} WH/Rupee
              </Typography>
              <Typography sx={{ mb: 3 }}>
                <b>Energy Available:</b> {selectedSeller.energyQuota} WH
              </Typography>
            </>
          )}
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
            <Button
              variant="contained"
              sx={{ bgcolor: "#00AAFF", color: "white" }}
              onClick={handleBuy}
            >
              INITIATE TRANSFER
            </Button>
            <Button variant="outlined" onClick={() => setSelectedSeller(null)}>
              CANCEL
            </Button>
          </Box>
        </Box>
      </Modal>

      <Modal
        open={transactionState.showSuccess}
        onClose={() =>
          setTransactionState((prev) => ({ ...prev, showSuccess: false }))
        }
      >
        <Box sx={modalStyle}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
            TRANSACTION INITIATED
          </Typography>
          <Typography sx={{ mb: 2 }}>
            Transaction Hash: {transactionState.hash}
          </Typography>
          <LinearProgress />
          <Typography sx={{ mt: 2 }}>
            Starting energy transfer process...
          </Typography>
        </Box>
      </Modal>

      <Modal
        open={transactionState.showProgress}
        onClose={() => {
          if (transactionState.progress >= 100) {
            setTransactionState((prev) => ({
              ...prev,
              showProgress: false,
              activeTransfer: false,
            }));
          }
        }}
      >
        <Box sx={modalStyle}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
            {transactionState.progress >= 100
              ? "TRANSFER COMPLETE"
              : "TRANSFER PROGRESS"}
          </Typography>
          <Box sx={{ position: "relative", display: "inline-flex" }}>
            <CircularProgress
              variant="determinate"
              value={transactionState.progress}
              size={80}
              sx={{ color: "#00AAFF" }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="h6">
                {`${Math.round(transactionState.progress)}%`}
              </Typography>
            </Box>
          </Box>
          <Typography sx={{ mt: 2 }}>
            {transactionState.progress >= 100
              ? "Energy transfer completed successfully!"
              : `Transferring from ${selectedSeller?.fullName}...`}
          </Typography>
          <Button
            sx={{ mt: 2, color: "#00AAFF" }}
            onClick={() =>
              setTransactionState((prev) => ({ ...prev, showProgress: false }))
            }
          >
            MONITOR IN BACKGROUND
          </Button>
        </Box>
      </Modal>
    </div>
  );
};

// Styles
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  textAlign: "center",
};

export default Dashboard;
