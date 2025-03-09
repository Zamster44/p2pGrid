import axois from "axios";
import { BASE_URL } from "./constants";

const axoisInstance = axois.create({
    baseURL : BASE_URL,
    timeout: 10000,
    Headers: {
        "Content-Type" : "application./json"
    },
});

axoisInstance.interceptors.request.use((config) => {
    const accesToken = localStorage.getItem("token");
    if(accesToken) {
        config.headers.Authorization = `Bearer ${accesToken}`;
    }
    return config;
},
   (error) => {
    return Promise.reject(error)
   }  
);

export default axoisInstance
