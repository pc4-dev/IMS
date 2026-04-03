import axios from 'axios';

const API_BASE = '/api';

const instance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export const api = {
  get: async (path: string, params?: { page?: number; limit?: number; fields?: string }) => {
    const res = await instance.get(path, { params });
    return res.data;
  },
  post: async (path: string, data: any) => {
    const res = await instance.post(path, data);
    return res.data.data;
  },
  put: async (path: string, id: string, data: any) => {
    const res = await instance.put(`${path}/${encodeURIComponent(id)}`, data);
    return res.data.data;
  },
  putSimple: async (path: string, data: any) => {
    const res = await instance.put(path, data);
    return res.data.data;
  },
  delete: async (path: string, id: string) => {
    const res = await instance.delete(`${path}/${encodeURIComponent(id)}`);
    return res.data;
  },
  seed: async (seedData: any) => {
    const res = await instance.post('seed', seedData);
    return res.data;
  },
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await instance.post('upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }
};
