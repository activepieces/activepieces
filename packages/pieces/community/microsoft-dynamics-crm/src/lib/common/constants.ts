export enum EntityAttributeType {
  PICKLIST = 'Picklist',
  VIRTUAL = 'Virtual',
  UNIQUE_IDENTIFIER = 'Uniqueidentifier',
  STRING = 'String',
  MEMO = 'Memo',
  MONEY = 'Money',
  DOUBLE = 'Double',
  INTEGER = 'Integer',
  LOOKUP = 'Lookup',
  CUSTOMER = 'Customer',
  DATETIME = 'DateTime',
  BOOLEAN = 'Boolean',
  BIGINT = 'BigInt',
  DECIMAL = 'Decimal',
  OWNER = 'Owner',
  ENTITY_NAME = 'EntityName',
  STATE = 'State',
  STATUS = 'Status',
  PARTY_LIST = 'PartyList',
}

export const LOOKUP_ATTRIBUTE_TYPES: string[] = [
  EntityAttributeType.LOOKUP,
  EntityAttributeType.CUSTOMER,
  EntityAttributeType.OWNER,
];

export const REQUEST_TIMEOUT_MS = 60000;
export const MAX_PAGE_SIZE = 5000;
export const AI_MAX_PAGE_SIZE = 100;
export const MAX_FETCHXML_URL_LENGTH = 32000;
