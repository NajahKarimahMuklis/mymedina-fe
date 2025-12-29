// utils/publicApi.js
import axios from "axios";

const publicApi = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default publicApi;
