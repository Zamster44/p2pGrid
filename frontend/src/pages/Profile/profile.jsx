import React from 'react'

const profile = () => {
    return (
        <div>
            <div className="flex justify-center p-2 text-xl text-[#00AAFF]">
                PROFILE
            </div>
            <hr className="border-t-1 border-black mx-2" />
            <div className="mt-10 p-2">
                <div className=" flex p-2 text-xl text-[#00AAFF]">
                    MY PROFILE
                </div>
                <hr className="border-t-1 border-black mx-2 mr-[500px]" />
                <div className="flex gap-60 p-2 text-base">
                    <div className="">Username : Zameer Siddiqui</div>
                    <div className="">Seller Status : False</div>
                </div>
            </div>

            <div className="mt-10 p-2">
                <div className=" flex p-2 text-xl text-[#00AAFF]">
                    Wallet
                </div>
                <hr className="border-t-1 border-black mx-2 mr-[500px]" />
                <div className="flex gap-80 p-2 text-base">
                    <div className="">Balance : 1000</div>
                    <div className="text-[#00AAFF]">+ADD MONEY</div>
                </div>
            </div>


        </div>
    )
}

export default profile