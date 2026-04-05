import { AggregateRoot } from '../base/aggregate-root.base';
import { PurchaseOrderPlacedEvent } from './purchase-order-placed.event';

export type PurchaseOrderStatus = 'draft' | 'submitted' | 'approved' | 'received' | 'cancelled';

export interface PurchaseOrderProps {
  supplierId: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
}

export class PurchaseOrder extends AggregateRoot<string> {
  private _supplierId: string;
  private _status: PurchaseOrderStatus;
  private _totalAmount: number;

  constructor(id: string, props: PurchaseOrderProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this._supplierId = props.supplierId;
    this._status = props.status;
    this._totalAmount = props.totalAmount;
  }

  get supplierId(): string { return this._supplierId; }
  get status(): PurchaseOrderStatus { return this._status; }
  get totalAmount(): number { return this._totalAmount; }

  place(): void {
    if (this._status !== 'draft') {
      throw new Error('Only draft purchase orders can be placed.');
    }
    this._status = 'submitted';
    this.touch();
    this.addDomainEvent(new PurchaseOrderPlacedEvent(this._id, this._supplierId));
  }
}
