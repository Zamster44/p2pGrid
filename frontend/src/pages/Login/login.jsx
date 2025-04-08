import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { validateEmail } from "../../utils/helper";
import axoisInstance from "../../utils/axoisInstance";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError("Please enter password");
      setIsLoading(false);
      return;
    }

    setError("");

    try {
      const response = await axoisInstance.post("/login", {
        email: email,
        password: password,
      });

      if (response.data?.accessToken) {
        localStorage.setItem("token", response.data.accessToken);
        localStorage.setItem("user", JSON.stringify(response.data));
        navigate("/dashboard");
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <form 
        onSubmit={handleLogin}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6"
      >
        <h1 className="text-4xl font-bold text-center text-[#00AAFF] mb-10">
          Welcome Back
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Email
            </label>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00AAFF] focus:border-transparent transition-all"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Password
            </label>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00AAFF] focus:border-transparent transition-all"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
            isLoading 
              ? 'bg-[#00AAFF]/70 cursor-not-allowed'
              : 'bg-[#00AAFF] hover:bg-[#0095e0]'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Logging in...
            </div>
          ) : (
            'Login'
          )}
        </button>

        {error && (
          <p className="text-red-500 text-sm text-center mt-4">{error}</p>
        )}

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/create"
            className="text-[#00AAFF] hover:text-[#0095e0] font-semibold"
          >
            Create Account
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;