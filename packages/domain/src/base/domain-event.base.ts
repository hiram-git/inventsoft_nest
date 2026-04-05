export abstract class DomainEvent {
  readonly occurredAt: Date;
  readonly eventName: string;

  constructor(eventName: string) {
    this.occurredAt = new Date();
    this.eventName = eventName;
  }
}
