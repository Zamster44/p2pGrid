import React from "react";

const sellerForm = () => {
  return (
    <div>
      <div className="flex justify-center p-2 text-xl text-[#00AAFF]">
        Seller Form
      </div>
      <hr className="border-t-1 border-black mx-2" />

      <div className="flex justify-center gap-20 mt-10">
        <div className="flex flex-col gap-3">
          <div className="m-5">
            <div className="text-lg">Name</div>
            <input
              className="border border-black rounded-md w-80 p-1"
              type="text"
              name=""
              id=""
            />
          </div>

          <div className=" m-5">
            <div className="text-lg">Price</div>
            <input
              className="border border-black rounded-md w-80 p-1"
              type="text"
              name=""
              id=""
            />
          </div>

          <div className=" m-5">
            <div className="text-lg">Power To Be Trasnform</div>
            <input
              className="border border-black rounded-md w-80 p-1"
              type="text"
              name=""
              id=""
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className=" m-5">
            <div className="text-lg">Current State Of Charge</div>
            <input
              className="border border-black rounded-md w-80 p-1"
              type="text"
              name=""
              id=""
            />
          </div>

          <div className=" m-5">
            <div className="text-lg">Unit No.</div>
            <input
              className="border border-black rounded-md w-80 p-1"
              type="text"
              name=""
              id=""
            />
          </div>
        </div>
      </div>
      <div className="flex justify-center items-center mt-20">
            <button className=" w-80 h-10 bg-[#00AAFF] text-white rounded-md">Submit</button>
      </div>
    </div>
  );
};

export default sellerForm;
