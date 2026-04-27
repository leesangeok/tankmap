import { client } from './client';
import type { WorkFormData, WorkStatus } from '../types';

export const worksApi = {
  list: (params?: { date?: string; status?: string; company_id?: string; q?: string }) =>
    client.get('/works', { params }).then((r) => r.data),

  get: (id: string) => client.get(`/works/${id}`).then((r) => r.data),

  create: (data: WorkFormData) => client.post('/works', data).then((r) => r.data),

  update: (id: string, data: Partial<WorkFormData>) =>
    client.patch(`/works/${id}`, data).then((r) => r.data),

  updateStatus: (id: string, status: WorkStatus) =>
    client.patch(`/works/${id}/status`, { status }).then((r) => r.data),

  delete: (id: string) => client.delete(`/works/${id}`),

  uploadPhoto: (id: string, file: File, category: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('category', category);
    return client.post(`/works/${id}/photos`, form).then((r) => r.data);
  },

  deletePhoto: (workId: string, photoId: string) =>
    client.delete(`/works/${workId}/photos/${photoId}`),

  getChecklists: (id: string) => client.get(`/works/${id}/checklists`).then((r) => r.data),

  toggleChecklist: (workId: string, itemId: string, isChecked: boolean) =>
    client.patch(`/works/${workId}/checklists/${itemId}`, { isChecked }).then((r) => r.data),
};

export const companiesApi = {
  list: (q?: string) => client.get('/companies', { params: { q } }).then((r) => r.data),
  create: (data: { name: string; phone?: string; memo?: string }) =>
    client.post('/companies', data).then((r) => r.data),
  update: (id: string, data: any) => client.patch(`/companies/${id}`, data).then((r) => r.data),
  delete: (id: string) => client.delete(`/companies/${id}`),
  sites: (companyId: string) =>
    client.get(`/companies/${companyId}/sites`).then((r) => r.data),
  createSite: (companyId: string, name: string, address?: string) =>
    client.post('/companies/sites', { companyId, name, address }).then((r) => r.data),
  updateSite: (id: string, data: any) =>
    client.patch(`/companies/sites/${id}`, data).then((r) => r.data),
  deleteSite: (id: string) => client.delete(`/companies/sites/${id}`),
};

export const tanksApi = {
  list: (siteId: string) =>
    client.get(`/sites/${siteId}/tanks`).then((r) => r.data),
  create: (siteId: string, data: { name: string; location: string; capacity: number; tankType?: string; note?: string }) =>
    client.post(`/sites/${siteId}/tanks`, data).then((r) => r.data),
  update: (id: string, data: any) => client.patch(`/tanks/${id}`, data).then((r) => r.data),
  delete: (id: string) => client.delete(`/tanks/${id}`),

  getPhotos: (tankId: string) =>
    client.get(`/tanks/${tankId}/photos`).then((r) => r.data),
  uploadPhoto: (tankId: string, file: File, category: string, caption?: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('category', category);
    if (caption) form.append('caption', caption);
    return client.post(`/tanks/${tankId}/photos`, form).then((r) => r.data);
  },
  deletePhoto: (tankId: string, photoId: string) =>
    client.delete(`/tanks/${tankId}/photos/${photoId}`),
};
