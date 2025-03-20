import React from "react";
import { useState } from "react";
import axoisInstance from "../../utils/axoisInstance";
import { validateEmail } from "../../utils/helper";
import { Link, useNavigate } from "react-router-dom";

const sellerForm = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [price, setPrice] = useState();
  const [powerToBeTransform, setPowerToBeTransform] = useState("");
  const [currentStateOfCharge, setCurrentStateOfCharge] = useState("");
  const [unitNO, setUnitNO] = useState("");
  const [error, setError] = useState(null);

  const handleForm = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      return;
    }

    if (!fullName) {
      setError("Please enter Your Name");
      return;
    }
    if (!price) {
      setError("Please enter Price");
      return;
    }
    if (!powerToBeTransform) {
      setError("Please enter Power To Be Transform");
      return;
    }
    if (!currentStateOfCharge) {
      setError("Please enter Current State Of Charge");
      return;
    }
    if (!unitNO) {
      setError("Please enter Unit Number");
      return;
    }

    setError("");

    //login api
    try {
      const response = await axoisInstance.post("/addSellerForm", {
        email: email,
        fullName : fullName , 
        price : price, 
        powerToBeTransForm : powerToBeTransform , 
        currentStateOfCharge : currentStateOfCharge , 
        unitNo : unitNO
      });

      if (response.data) {
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
    <div>
      <div className="flex justify-center p-2 text-xl text-[#00AAFF]">
        Seller Form
      </div>
      <hr className="border-t-1 border-black mx-2" />
      <form onSubmit={handleForm}>
        <div className="flex justify-center gap-20 mt-10">
          <div className="flex flex-col gap-3">
            <div className="m-5">
              <div className="text-lg">Name</div>
              <input
                className="border border-black rounded-md w-80 p-1"
                type="text"
                placeholder="Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className=" m-5">
              <div className="text-lg">Price</div>
              <input
                className="border border-black rounded-md w-80 p-1"
                type="text"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div className=" m-5">
              <div className="text-lg">Power To Be Trasnform</div>
              <input
                className="border border-black rounded-md w-80 p-1"
                type="text"
                placeholder="Power To Be Trasnform"
                value={powerToBeTransform}
                onChange={(e) => setPowerToBeTransform(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
          <div className="m-5">
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
              <div className="text-lg">Current State Of Charge</div>
              <input
                className="border border-black rounded-md w-80 p-1"
                type="text"
                placeholder="Current State Of Charge"
                value={currentStateOfCharge}
                onChange={(e) => setCurrentStateOfCharge(e.target.value)}
              />
            </div>

            <div className=" m-5">
              <div className="text-lg">Unit No.</div>
              <input
                className="border border-black rounded-md w-80 p-1"
                type="text"
                placeholder="Current State Of Charge"
                value={unitNO}
                onChange={(e) => setUnitNO(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center mt-20">
          <button className=" w-80 h-10 bg-[#00AAFF] text-white rounded-md">
            Submit
          </button>
        </div>
        {error && 
        <div className="flex justify-center items-center">
          <p className="text-red-500 text-base mt-5 mx-auto">{error}</p>
        </div>
        }
      </form>
    </div>
  );
};

export default sellerForm;
