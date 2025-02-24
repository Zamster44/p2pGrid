import React from "react";

const Dashboard = () => {
  return (
    <div>
      <div className="flex justify-end p-2 text-xl cursor-pointer text-[#00AAFF]">
        MY PROFILE
      </div>
      <hr className="border-t-1 border-black mx-2" />

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
            <tr className="border-b border-black">
              <th scope="row" className="px-6 py-4 font-medium border-r border-black">
                SIDDHART KUMAR
              </th>
              <td className="px-6 py-4">1.5 Unit/Rupee</td>
            </tr>
            <tr className="border-b border-black">
              <th scope="row" className="px-6 py-4 font-medium border-r border-black">
                Aryan Patel
              </th>
              <td className="px-6 py-4">1.75 Unit/Rupee</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
