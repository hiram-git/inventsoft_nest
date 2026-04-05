export abstract class Entity<TId> {
  protected readonly _id: TId;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(id: TId, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt ?? new Date();
    this._updatedAt = updatedAt ?? new Date();
  }

  get id(): TId {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected touch(): void {
    this._updatedAt = new Date();
  }

  equals(other: Entity<TId>): boolean {
    if (!(other instanceof Entity)) return false;
    return this._id === other._id;
  }
}
