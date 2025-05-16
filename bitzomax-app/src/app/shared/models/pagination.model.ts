/**
 * Page request interface for pagination
 */
export interface PageRequest {
  page: number;
  size: number;
  sort?: string;
  direction?: 'asc' | 'desc';
  filter?: string;
  filterType?: string;
}

/**
 * Page response interface for pagination
 */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
