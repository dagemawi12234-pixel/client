import axios from "axios";

const api = axios.create({
  baseURL: "https://github.com/dagemawi12234-pixel/client.git"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("task_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
