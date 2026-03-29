import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (email, password) =>
  api.post("/auth/register", { email, password });

export const login = (email, password) =>
  api.post("/auth/login", { email, password });

// Notes
export const getNotes = () => api.get("/notes/");
export const createNote = (title, content) =>
  api.post("/notes/", { title, content });
export const deleteNote = (id) => api.delete(`/notes/${id}`);
export const summarizeNote = (id) => api.post(`/notes/${id}/summarize`);

export default api;