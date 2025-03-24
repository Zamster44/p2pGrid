import Login from "./pages/Login/login";
import Create from "./pages/Create/create";
import Dashboard from "./pages/Dashboard/dashboard";
import Profile from "./pages/Profile/profile";
import SellerForm from "./pages/SellerForm/sellerForm";
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'

function App() {
  return (
    <div className="">
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/create" element={<Create />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/sellerForm" element={<SellerForm />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;