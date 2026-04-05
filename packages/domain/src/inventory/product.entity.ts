import { AggregateRoot } from '../base/aggregate-root.base';
import { StockLevel } from './stock-level.value-object';
import { InventoryAdjustedEvent } from './inventory-adjusted.event';

export interface ProductProps {
  sku: string;
  name: string;
  description: string;
  stockLevel: StockLevel;
  unitCost: number;
  isActive: boolean;
}

export class Product extends AggregateRoot<string> {
  private _sku: string;
  private _name: string;
  private _description: string;
  private _stockLevel: StockLevel;
  private _unitCost: number;
  private _isActive: boolean;

  constructor(id: string, props: ProductProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this._sku = props.sku;
    this._name = props.name;
    this._description = props.description;
    this._stockLevel = props.stockLevel;
    this._unitCost = props.unitCost;
    this._isActive = props.isActive;
  }

  get sku(): string { return this._sku; }
  get name(): string { return this._name; }
  get description(): string { return this._description; }
  get stockLevel(): StockLevel { return this._stockLevel; }
  get unitCost(): number { return this._unitCost; }
  get isActive(): boolean { return this._isActive; }

  adjustStock(delta: number, reason: string): void {
    const newQty = this._stockLevel.quantity + delta;
    this._stockLevel = StockLevel.create(newQty);
    this.touch();
    this.addDomainEvent(
      new InventoryAdjustedEvent(this._id, this._sku, delta, newQty, reason),
    );
  }

  deactivate(): void {
    this._isActive = false;
    this.touch();
  }
}
