

export enum FilterOperator {
    TEXT_CONTAINS = 'TEXT_CONTAINS',
    TEXT_DOES_NOT_CONTAIN = 'TEXT_DOES_NOT_CONTAIN',
    TEXT_EXACTLY_MATCHES = 'TEXT_EXACTLY_MATCHES',
    TEXT_DOES_NOT_EXACTLY_MATCH = 'TEXT_DOES_NOT_EXACTLY_MATCH',
    NUMBER_IS_GREATER_THAN = 'NUMBER_IS_GREATER_THAN',
    NUMBER_IS_LESS_THAN = 'NUMBER_IS_LESS_THAN',
    NUMBER_IS_EQUAL_TO = 'NUMBER_IS_EQUAL_TO',
    DATE_IS_BEFORE = 'DATE_IS_BEFORE',
    DATE_IS_EQUAL = 'DATE_IS_EQUAL',
    DATE_IS_AFTER = 'DATE_IS_AFTER',
    DATE_IS_ON_OR_BEFORE = 'DATE_IS_ON_OR_BEFORE',
    DATE_IS_ON_OR_AFTER = 'DATE_IS_ON_OR_AFTER',
}

export const filterOperatorLabels: Record<FilterOperator, string> = {
  [FilterOperator.TEXT_CONTAINS]: '(Text) Contains',
  [FilterOperator.TEXT_DOES_NOT_CONTAIN]: '(Text) Does not contain',
  [FilterOperator.TEXT_EXACTLY_MATCHES]: '(Text) Exactly matches',
  [FilterOperator.TEXT_DOES_NOT_EXACTLY_MATCH]: '(Text) Does not exactly match',

  [FilterOperator.NUMBER_IS_GREATER_THAN]: '(Number) Is greater than',
  [FilterOperator.NUMBER_IS_LESS_THAN]: '(Number) Is less than',
  [FilterOperator.NUMBER_IS_EQUAL_TO]: '(Number) Is equal to',

  [FilterOperator.DATE_IS_BEFORE]: '(Date) Is before',
  [FilterOperator.DATE_IS_EQUAL]: '(Date) Is equal',
  [FilterOperator.DATE_IS_AFTER]: '(Date) Is after',
  [FilterOperator.DATE_IS_ON_OR_BEFORE]: '(Date) Is On or Before',
  [FilterOperator.DATE_IS_ON_OR_AFTER]: '(Date) Is On or After',

};
