import { DomainEvent } from '../base/domain-event.base';

export class SaleOrderCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'sales.order.created';

  constructor(
    readonly saleOrderId: string,
    readonly customerId: string,
  ) {
    super(SaleOrderCreatedEvent.EVENT_NAME);
  }
}
