export class DomainError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = code;
  }
}

export class InvalidMeasureError extends DomainError {
  constructor(m: string) { super('INVALID_MEASURE', m); }
}

export class InvalidMoneyError extends DomainError {
  constructor(m: string) { super('INVALID_MONEY', m); }
}

export class DiscountExceedsTotalError extends DomainError {
  constructor(m: string) { super('DISCOUNT_EXCEEDS_TOTAL', m); }
}
