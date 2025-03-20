import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { validateEmail } from "../../utils/helper";
import axoisInstance from "../../utils/axoisInstance";

const create = () => {
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!name) {
      setError("Please enter Name");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      return;
    }

    if (!password) {
      setError("Please enter password");
      return;
    }

    setError("");

    //api
    try {
      const response = await axoisInstance.post("/create-account", {
        fullName: name,
        email: email,
        password: password,
        seller : false,
      });

      if (response.data && response.data.error) {
        setError(response.data.message);
        return;
      }

      if (response.data && response.data.accessToken) {
        localStorage.setItem("token", response.data.accessToken);
        localStorage.setItem("user", JSON.stringify(response.data));
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

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center ">
      <form onSubmit={handleSignup}>
        <div className=" flex flex-col items-center justify-center">
          <div className="text-[#00AAFF] text-6xl m-6">CREATE AN ACCOUNT</div>

          <div className="m-5">
            <div className="text-lg">Name</div>
            <input
              className="border border-black rounded-md w-80 p-1"
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className=" m-5">
            <div className="text-lg">Email</div>
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

          <button className="mt-5 w-80 h-10 bg-[#00AAFF] text-white rounded-md">
            Create
          </button>
          {error && <p className="text-red-500 text-base mt-5 ">{error}</p>}
        </div>
      </form>
    </div>
  );
};

export default create;
