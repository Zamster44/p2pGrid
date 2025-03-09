import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { validateEmail } from "../../utils/helper";
import axoisInstance from "../../utils/axoisInstance";

const login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      return;
    }

    if (!password) {
      setError("Please enter password");
      return;
    }

    setError("");

    //login api
    try {
      const response = await axoisInstance.post("/login", {
        email: email,
        password: password,
      });

      if (response.data && response.data.accessToken) {
        localStorage.setItem("token", response.data.accessToken);
        navigate("/dashboard");
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setError(error.response.data.message);
      } else {
        setError("An unexpected error occured");
      }
    }
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center ">
      <form onSubmit={handleLogin}>
        <div className=" flex flex-col items-center justify-center">
          <div className="text-[#00AAFF] text-6xl m-8">LOGIN</div>

          <div className="m-5">
            <div className="text-lg">EMAIL</div>
            <input
              className="border border-black rounded-md w-80 p-1"
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className=" m-5">
            <div className="text-lg">Password</div>
            <input
              className="border border-black rounded-md w-80 p-1"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              type="password"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            className="mt-5 w-80 h-10 bg-[#00AAFF] text-white rounded-md"
          >
            Login
          </button>
          <p className="text-sm">
            Don't have a account?{" "}
            <Link to={"/create"} className="text-[#00AAFF]">
              Create Account.
            </Link>
          </p>
          {error && <p className="text-red-500 text-base mt-5 ">{error}</p>}
        </div>
      </form>
    </div>
  );
};

export default login;
