import { ValueObject } from '../base/value-object.base';

interface StockLevelProps {
  quantity: number;
}

export class StockLevel extends ValueObject<StockLevelProps> {
  private constructor(props: StockLevelProps) {
    super(props);
    this.validate();
  }

  static create(quantity: number): StockLevel {
    return new StockLevel({ quantity });
  }

  get quantity(): number {
    return this.props['quantity'];
  }

  get isOutOfStock(): boolean {
    return this.props['quantity'] === 0;
  }

  get isLowStock(): boolean {
    return this.props['quantity'] > 0 && this.props['quantity'] <= 10;
  }

  protected validate(): void {
    if (this.props['quantity'] < 0) {
      throw new Error(`Stock quantity cannot be negative. Got: ${this.props['quantity']}`);
    }
  }
}
