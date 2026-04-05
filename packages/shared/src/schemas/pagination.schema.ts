import { z } from 'zod';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE } from '../constants/pagination.constants';

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(MIN_PAGE).default(MIN_PAGE),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type PaginationInput = z.input<typeof PaginationSchema>;
export type Pagination = z.output<typeof PaginationSchema>;
