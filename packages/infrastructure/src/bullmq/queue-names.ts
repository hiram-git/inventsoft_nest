export const QUEUE_NAMES = {
  INVENTORY_ADJUSTMENTS: 'inventory:adjustments',
  PURCHASE_ORDER_PROCESSING: 'purchases:order-processing',
  SALE_ORDER_PROCESSING: 'sales:order-processing',
  REPORTING_REFRESH: 'reporting:refresh',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
