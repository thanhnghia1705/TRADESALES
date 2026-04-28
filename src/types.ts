export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'sales' | 'blocked';
  region?: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  title: string;
  parentId: string | null;
  type: 'main' | 'sub';
  order: number;
}

export interface Document {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  subcategoryId: string | null;
  type: 'text' | 'word' | 'excel' | 'image' | 'link';
  tags: string[];
  brand?: string;
  status: 'new' | 'active' | 'expired' | 'urgent';
  publishDate?: string;
  expireDate?: string;
  fileUrl: string | null;
  links?: string[];
  authorId: string;
  isRequireReadReceipt?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'high' | 'medium' | 'low';
  assigneeIds: string[];
  region?: string;
  documentId: string | null;
  links?: string[];  // Multiple links attachment for task
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReadReceipt {
  id: string;
  documentId: string;
  userId: string;
  readAt: string;
}
