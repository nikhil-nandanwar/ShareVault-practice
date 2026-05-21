// API base URL resolution:
//
//   1. If NEXT_PUBLIC_BACKEND_URL is set (e.g. "https://your-backend.example.com"),
//      we call it directly from the browser. This matches the old Vite setup
//      (VITE_BACKEND_URL) and requires the backend to allow CORS from this origin.
//
//   2. Otherwise we call same-origin "/api/*", which is proxied to BACKEND_URL
//      by next.config.ts rewrites. This avoids CORS entirely but requires
//      BACKEND_URL to be set as a Vercel env var.
//
// Set exactly ONE of the two in Vercel → Project Settings → Environment Variables.
const publicBackend = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, '');

export const API_BASE_URL = publicBackend ? `${publicBackend}/api` : '/api';

export const ENDPOINTS = {
    UPLOAD_TEXT: '/upload/text',
    UPLOAD_FILE: '/upload/file',
    GET_CONTENT: (code: string) => `/content/${code}`,
    DOWNLOAD_FILE: (code: string, fileIndex: number) => `/download/${code}/${fileIndex}`,
};
