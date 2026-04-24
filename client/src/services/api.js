import axios from "axios";
import { store } from "../store/store.js";
import { logout } from "../store/authSlice.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      !original._retry
    ) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || "/api"}/auth/refresh-token`,
          { refreshToken }
        );
        const { accessToken, refreshToken: newRefresh } = res.data;
        localStorage.setItem("accessToken",  accessToken);
        localStorage.setItem("refreshToken", newRefresh);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        store.dispatch(logout());
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;