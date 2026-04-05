import { AggregateRoot } from '../base/aggregate-root.base';
import { SaleOrderCreatedEvent } from './sale-order-created.event';

export type SaleOrderStatus = 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface SaleOrderProps {
  customerId: string;
  status: SaleOrderStatus;
  totalAmount: number;
}

export class SaleOrder extends AggregateRoot<string> {
  private _customerId: string;
  private _status: SaleOrderStatus;
  private _totalAmount: number;

  constructor(id: string, props: SaleOrderProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this._customerId = props.customerId;
    this._status = props.status;
    this._totalAmount = props.totalAmount;
  }

  get customerId(): string { return this._customerId; }
  get status(): SaleOrderStatus { return this._status; }
  get totalAmount(): number { return this._totalAmount; }

  confirm(): void {
    if (this._status !== 'draft') {
      throw new Error('Only draft sale orders can be confirmed.');
    }
    this._status = 'confirmed';
    this.touch();
    this.addDomainEvent(new SaleOrderCreatedEvent(this._id, this._customerId));
  }

  ship(): void {
    if (this._status !== 'confirmed') {
      throw new Error('Only confirmed sale orders can be shipped.');
    }
    this._status = 'shipped';
    this.touch();
  }

  deliver(): void {
    if (this._status !== 'shipped') {
      throw new Error('Only shipped sale orders can be delivered.');
    }
    this._status = 'delivered';
    this.touch();
  }

  cancel(): void {
    if (this._status === 'delivered') {
      throw new Error('Delivered sale orders cannot be cancelled.');
    }
    this._status = 'cancelled';
    this.touch();
  }
}
