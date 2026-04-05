export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp: string;
  path?: string;
}

export interface PaginatedApiResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
