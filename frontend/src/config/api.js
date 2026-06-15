const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "");

export const API_BASE_URL = backendUrl ? `${backendUrl}/api` : "/api";

export const ENDPOINTS = {
  UPLOAD_TEXT: "/upload/text",
  UPLOAD_FILE: "/upload/file",
  GET_CONTENT: (code) => `/content/${code}`,
  DOWNLOAD_FILE: (code) => `/download/${code}`,
};
