// frontend/src/types.ts

export type Area = 'KNOWLEDGE' | 'PASSIVE' | 'ACTIVE';
export type Status = 'WAITING' | 'ACTIVE' | 'PAUSED';
export type TrackingType = 'CREATION' | 'STEP_CHANGE' | 'STATUS_CHANGE' | 'ENTRY_EDIT' | 'MANUAL' | 'RESTORE';

export interface User {
  id: number;
  username: string;
}

export interface Topic {
  id: number;
  name: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Step {
  order: number;
  description: string;
}

export interface Tracking {
  id: number;
  entryId: number;
  trackingType: TrackingType;
  timestamp: string;
  note?: string;
  previousStep?: string;
  newStep?: string;
  oldStatus?: Status;
  newStatus?: Status;
  createdAt: string;
}

export interface Entry {
  id: number;
  essenceText: string;
  essenceShort: string;
  area: Area;
  actionName?: string;
  benefit?: string;
  steps?: Step[];
  status?: Status;
  pauseReason?: string;
  currentStepIndex?: number;
  deletedAt?: string | null;
  permanentlyRemoved?: boolean;
  topicId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
  trackings?: Tracking[];
}

export interface TrashEntry extends Pick<Entry, 'id' | 'essenceShort' | 'actionName' | 'benefit' | 'topicId'> {
  deletedAt: string;
}

export interface CreateEntryPayload {
  area: Area;
  topicId: number;
  essenceText: string;
  essenceShort: string;
  actionName?: string;
  benefit?: string;
  steps?: { description: string }[];
  status?: Status;
  pauseReason?: string;
}

// ============================================
// Pagination Types
// ============================================
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ============================================
// API Error
// ============================================
export class ApiError extends Error {
  public status?: number;
  public data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// ============================================
// Filter Types
// ============================================
export interface EntryFilters {
  topicId?: number;
  area?: Area;
  status?: Status;
  deletedOnly?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'id' | 'essenceShort' | 'status' | 'area';
  sortOrder?: 'asc' | 'desc';
}