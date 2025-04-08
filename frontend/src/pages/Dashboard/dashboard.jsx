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
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#00AAFF]">
            Energy Marketplace
          </h1>
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center space-x-2 text-[#00AAFF] hover:text-[#0095e0] transition-colors"
            >
              <span className="font-medium">MY PROFILE</span>
              <svg
                className={`w-4 h-4 transform transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Profile Dropdown */}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100">
                <div className="p-2 space-y-1">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    Profile
                  </Link>
                  {currentUser?.seller ? (
                    <Link
                      to="/sellerForm"
                      className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      Edit Seller Form
                    </Link>
                  ) : (
                    <Link
                      to="/sellerForm"
                      className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      Add Seller Form
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      localStorage.clear();
                      navigate("/");
                    }}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Available Energy Providers
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Select a provider to initiate energy transfer
            </p>
          </div>

          {/* Sellers Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">
                    Provider Name
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 uppercase">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sellers.map((seller) => (
                  <tr
                    key={seller._id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedSeller(seller)}
                  >
                    <td className="px-6 py-4">
                      <button className="text-left font-medium text-[#00AAFF] hover:text-[#0095e0] transition-colors">
                        {seller.fullName}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-700">
                      {seller.price} WH/Rupee
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
            TRADE SUCCESSFULL
          </Typography>
          <Typography sx={{ mb: 2 }}>
          TRANSACTION INITIATED
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
