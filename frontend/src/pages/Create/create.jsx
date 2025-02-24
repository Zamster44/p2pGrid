import React from 'react'

const create = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center ">
      <div className=" flex flex-col items-center justify-center">
        <div className="text-[#00AAFF] text-6xl m-8">CREATE AN ACCOUNT</div>

        <div className="m-5">
          <div className="text-lg">USERNAME</div>
          <input className="border border-black rounded-md w-80 p-1" type="text" name="" id="" />
        </div>

        <div className=" m-5">
          <div className="text-lg">Password</div>
          <input className="border border-black rounded-md w-80 p-1" type="password" name="" id="" />
        </div>

        <div className=" m-5">
          <div className="text-lg">Re-Enter Password</div>
          <input className="border border-black rounded-md w-80 p-1" type="password" name="" id="" />
        </div>

        <button className="mt-5 w-80 h-10 bg-[#00AAFF] text-white rounded-md">Create</button>

      </div>
    </div>
  )
}

export default create