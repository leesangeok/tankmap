export type UserRole = 'admin' | 'worker';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type WorkStatus = 'scheduled' | 'in_progress' | 'completed' | 'on_hold';
export type PhotoCategory = 'before' | 'during' | 'after' | 'oxygen';

export type TankPhotoCategory = 'location' | 'interior' | 'exterior' | 'general';

export interface TankPhoto {
  id: string;
  tankId: string;
  category: TankPhotoCategory;
  url: string;
  filename: string;
  caption?: string;
  createdAt: string;
  uploadedBy?: { name: string };
}

export interface Tank {
  id: string;
  siteId: string;
  name: string;
  location: '지하' | '지상';
  capacity: number;
  tankType?: string;
  note?: string;
  createdAt: string;
  photos?: TankPhoto[];
}

export interface Company {
  id: string;
  name: string;
  phone?: string;
  memo?: string;
  sites?: Site[];
  _count?: { sites: number };
}

export interface Site {
  id: string;
  name: string;
  address?: string;
  company: Company;
  tanks?: Tank[];
  _count?: { works: number };
}

export interface WorkPhoto {
  id: string;
  workId: string;
  category: PhotoCategory;
  url: string;
  filename: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  order: number;
}

export interface WorkChecklist {
  id: string;
  workId: string;
  checklistItemId: string;
  isChecked: boolean;
  checkedAt?: string;
  checklistItem: ChecklistItem;
}

export interface Work {
  id: string;
  siteId: string;
  title?: string;
  workDate: string;
  status: WorkStatus;
  durationHours?: number;
  requiredPeople?: number;
  difficulty?: number;
  equipment?: string[];
  notes?: string;
  caution?: string;
  memo?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  site: Site;
  tanks?: Tank[];
  createdBy: { name: string };
  updatedBy?: { name: string };
  photos?: WorkPhoto[];
  checklists?: WorkChecklist[];
  _count?: { photos: number; checklists: number };
}

export interface WorkFormData {
  siteId: string;
  tankIds?: string[];
  title?: string;
  workDate: string;
  status: WorkStatus;
  durationHours?: number;
  requiredPeople?: number;
  difficulty?: number;
  equipment?: string[];
  notes?: string;
  caution?: string;
  memo?: string;
}
