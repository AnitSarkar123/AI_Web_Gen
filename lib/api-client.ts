import { treaty } from "@elysiajs/eden";
import { App } from "@/app/api/[[...slugs]]/route";
// import { headers } from "next/headers";

// Use NEXT_PUBLIC_API_URL for production, fallback to localhost for development
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// .api to enter /api prefix
export const apiClient = treaty<App>(apiUrl).api;

export const getApiClient = (headers?: Headers) => {
  return treaty<App>(apiUrl, { headers }).api;
};

