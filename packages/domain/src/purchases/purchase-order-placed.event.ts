import { DomainEvent } from '../base/domain-event.base';

export class PurchaseOrderPlacedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'purchases.order.placed';

  constructor(
    readonly purchaseOrderId: string,
    readonly supplierId: string,
  ) {
    super(PurchaseOrderPlacedEvent.EVENT_NAME);
  }
}
