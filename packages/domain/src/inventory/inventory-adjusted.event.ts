import { DomainEvent } from '../base/domain-event.base';

export class InventoryAdjustedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'inventory.adjusted';

  constructor(
    readonly productId: string,
    readonly sku: string,
    readonly delta: number,
    readonly newQuantity: number,
    readonly reason: string,
  ) {
    super(InventoryAdjustedEvent.EVENT_NAME);
  }
}
