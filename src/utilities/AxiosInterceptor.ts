import axios, { AxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

// || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"; || "https://server.mcem.site"

const API_URL = "https://server.mcem.site"

const axiosApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Request interceptor to add Authorization header
axiosApi.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Function to handle token expiration
const handleTokenExpiration = () => {
  Cookies.remove('token');
  
  Cookies.set(
    "toastMessage",
    JSON.stringify({
      message: "Your session has expired.",
      description: "Please log in again.",
    }),
    { expires: 1 }
  );

  window.location.href = '/auth/login';
};

// Axios response interceptor to handle token expiration on 401 errors
axiosApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Only handle token expiration for authenticated routes, not login
    if (error.response && error.response.status === 401 && !error.config.url?.includes('/auth/login')) {
      // Token expired or invalid, redirect to login
      handleTokenExpiration();
    }

    return Promise.reject(error);
  }
);



// Helper functions for HTTP methods
export async function get<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
  try {
    const response = await axiosApi.get<T>(url, { ...config });
    return response.data;
  } catch (error) {
    if (!axios.isAxiosError(error) || !error.response || error.response.status !== 401) {
      console.error("GET Request Error:", error);
    }
    throw error;
  }
}

export async function post<T>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<T> {
  try {
    const response = await axiosApi.post<T>(url, data, { ...config });
    return response.data;
  } catch (error) {
    if (!axios.isAxiosError(error) || !error.response || error.response.status !== 401) {
      console.error("POST Request Error:", error);
    }
    throw error;
  }
}

export async function put<T>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<T> {
  try {
    const response = await axiosApi.put<T>(url, data, { ...config });
    return response.data;
  } catch (error) {
    if (!axios.isAxiosError(error) || !error.response || error.response.status !== 401) {
      console.error("PUT Request Error:", error);
    }
    throw error;
  }
}

// New delete function (named 'del' to match your original)
export async function del<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
  try {
    const response = await axiosApi.delete<T>(url, { ...config });
    return response.data;
  } catch (error) {
    if (!axios.isAxiosError(error) || !error.response || error.response.status !== 401) {
      console.error("DELETE Request Error:", error);
    }
    throw error;
  }
}

// New patch function
export async function patch<T>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<T> {
  try {
    const response = await axiosApi.patch<T>(url, data, { ...config });
    return response.data;
  } catch (error) {
    if (!axios.isAxiosError(error) || !error.response || error.response.status !== 401) {
      console.error("PATCH Request Error:", error);
    }
    throw error;
  }
}

// Download function for files with authentication
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const response = await axiosApi.get(url, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  } catch (error) {
    if (!axios.isAxiosError(error) || !error.response || error.response.status !== 401) {
      console.error("Download Error:", error);
    }
    throw error;
  }
}

export default axiosApi;