

export enum FilterOperator {
    TEXT_CONTAINS = 'TEXT_CONTAINS',
    TEXT_DOES_NOT_CONTAIN = 'TEXT_DOES_NOT_CONTAIN',
    TEXT_EXACTLY_MATCHES = 'TEXT_EXACTLY_MATCHES',
    TEXT_DOES_NOT_EXACTLY_MATCH = 'TEXT_DOES_NOT_EXACTLY_MATCH',
    // TEXT_STARTS_WITH = 'TEXT_START_WITH',
    // TEXT_DOES_NOT_START_WITH = 'TEXT_DOES_NOT_START_WITH',
    // TEXT_ENDS_WITH = 'TEXT_ENDS_WITH',
    // TEXT_DOES_NOT_END_WITH = 'TEXT_DOES_NOT_END_WITH',
    NUMBER_IS_GREATER_THAN = 'NUMBER_IS_GREATER_THAN',
    NUMBER_IS_LESS_THAN = 'NUMBER_IS_LESS_THAN',
    NUMBER_IS_EQUAL_TO = 'NUMBER_IS_EQUAL_TO',
    // BOOLEAN_IS_TRUE = 'BOOLEAN_IS_TRUE',
    // BOOLEAN_IS_FALSE = 'BOOLEAN_IS_FALSE',
    DATE_IS_BEFORE = 'DATE_IS_BEFORE',
    DATE_IS_EQUAL = 'DATE_IS_EQUAL',
    DATE_IS_AFTER = 'DATE_IS_AFTER',
    // LIST_CONTAINS = 'LIST_CONTAINS',
    // LIST_DOES_NOT_CONTAIN = 'LIST_DOES_NOT_CONTAIN',
    // LIST_IS_EMPTY = 'LIST_IS_EMPTY',
    // LIST_IS_NOT_EMPTY = 'LIST_IS_NOT_EMPTY',
    // EXISTS = 'EXISTS',
    // DOES_NOT_EXIST = 'DOES_NOT_EXIST',
}

export const filterOperatorLabels: Record<FilterOperator, string> = {
  [FilterOperator.TEXT_CONTAINS]: '(Text) Contains',
  [FilterOperator.TEXT_DOES_NOT_CONTAIN]: '(Text) Does not contain',
  [FilterOperator.TEXT_EXACTLY_MATCHES]: '(Text) Exactly matches',
  [FilterOperator.TEXT_DOES_NOT_EXACTLY_MATCH]: '(Text) Does not exactly match',
//   [FilterOperator.TEXT_STARTS_WITH]: '(Text) Starts with',
//   [FilterOperator.TEXT_DOES_NOT_START_WITH]: '(Text) Does not start with',
//   [FilterOperator.TEXT_ENDS_WITH]: '(Text) Ends with',
//   [FilterOperator.TEXT_DOES_NOT_END_WITH]: '(Text) Does not end with',

  [FilterOperator.NUMBER_IS_GREATER_THAN]: '(Number) Is greater than',
  [FilterOperator.NUMBER_IS_LESS_THAN]: '(Number) Is less than',
  [FilterOperator.NUMBER_IS_EQUAL_TO]: '(Number) Is equal to',

  [FilterOperator.DATE_IS_BEFORE]: '(Date) Is before',
  [FilterOperator.DATE_IS_EQUAL]: '(Date) Is equal',
  [FilterOperator.DATE_IS_AFTER]: '(Date) Is after',

//   [FilterOperator.BOOLEAN_IS_TRUE]: '(Boolean) Is true',
//   [FilterOperator.BOOLEAN_IS_FALSE]: '(Boolean) Is false',

//   [FilterOperator.LIST_CONTAINS]: '(List) Contains',
//   [FilterOperator.LIST_DOES_NOT_CONTAIN]: '(List) Does not contain',
//   [FilterOperator.LIST_IS_EMPTY]: '(List) Is empty',
//   [FilterOperator.LIST_IS_NOT_EMPTY]: '(List) Is not empty',

//   [FilterOperator.EXISTS]: 'Exists',
//   [FilterOperator.DOES_NOT_EXIST]: 'Does not exist',
};
