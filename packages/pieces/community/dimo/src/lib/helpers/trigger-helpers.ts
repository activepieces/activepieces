export enum Operator {
  EQUAL = 'equal',
  GREATER_THAN = 'greater',
  LESS_THAN = 'less',
}

export function getNumberExpression(comparisonType: Operator, value: number): string {
  switch (comparisonType) {
    case Operator.EQUAL:
      return `valueNumber = ${value}`;
    case Operator.GREATER_THAN:
      return `valueNumber > ${value}`;
    case Operator.LESS_THAN:
      return `valueNumber < ${value}`;

    default:
      throw new Error('Invalid comparison type');
  }
}
