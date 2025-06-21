export enum Operator {
  EQUAL = 'equal',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUAL = 'greater_or_equal',
  LESS_THAN_OR_EQUAL = 'less_or_equal',
}

export function getNumberExpression(comparisonType: Operator, value: number): string {
  switch (comparisonType) {
    case Operator.EQUAL:
      return `valueNumber = ${value}`;
    case Operator.GREATER_THAN:
      return `valueNumber > ${value}`;
    case Operator.LESS_THAN:
      return `valueNumber < ${value}`;
    case Operator.GREATER_THAN_OR_EQUAL:
      return `valueNumber >= ${value}`;
    case Operator.LESS_THAN_OR_EQUAL:
      return `valueNumber <= ${value}`;

    default:
      throw new Error('Invalid comparison type');
  }
}
