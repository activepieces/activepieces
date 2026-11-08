import { common } from './index';

const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

export function buildDriveSearchQuery({
  queryTerm,
  operator,
  query,
  parentFolder,
  type,
}: {
  queryTerm: string;
  operator: string;
  query: string;
  parentFolder: string | undefined;
  type: string;
}): string {
  const field = allowedValue({
    value: queryTerm,
    allowed: DRIVE_SEARCH_FIELDS,
    kind: 'search field',
  });
  const match = allowedValue({
    value: operator,
    allowed: DRIVE_SEARCH_OPERATORS,
    kind: 'match operator',
  });
  const clauses = [
    `${field} ${match} '${common.escapeDriveQueryLiteral(query)}'`,
  ];
  if (parentFolder) {
    clauses.push(
      `'${common.escapeDriveQueryLiteral(parentFolder)}' in parents`
    );
  }
  if (type === 'file') {
    clauses.push(`mimeType!='${FOLDER_MIME_TYPE}'`);
  }
  if (type === 'folder') {
    clauses.push(`mimeType='${FOLDER_MIME_TYPE}'`);
  }
  return clauses.join(' and ');
}

function allowedValue<T extends string>({
  value,
  allowed,
  kind,
}: {
  value: string;
  allowed: readonly T[];
  kind: string;
}): T {
  const match = allowed.find((candidate) => candidate === value);
  if (match === undefined) {
    throw new Error(
      `Unsupported ${kind} '${value}'. Use one of: ${allowed.join(', ')}.`
    );
  }
  return match;
}

export const DRIVE_SEARCH_FIELD_CHOICES: readonly DriveSearchFieldChoice[] = [
  'name',
  'fullText',
  'mimeType',
];
export const DRIVE_SEARCH_OPERATOR_CHOICES: readonly DriveSearchOperatorChoice[] =
  ['contains', '='];
export const DRIVE_SEARCH_FIELDS: readonly DriveSearchField[] = [
  ...DRIVE_SEARCH_FIELD_CHOICES,
  'modifiedTime',
  'viewedByMeTime',
  'createdTime',
  'sharedWithMeTime',
  'trashed',
  'starred',
  'sharedWithMe',
  'visibility',
  'shortcutDetails.targetId',
];
export const DRIVE_SEARCH_OPERATORS: readonly DriveSearchOperator[] = [
  ...DRIVE_SEARCH_OPERATOR_CHOICES,
  '!=',
  '<',
  '<=',
  '>',
  '>=',
];

export type DriveSearchFieldChoice = 'name' | 'fullText' | 'mimeType';
export type DriveSearchOperatorChoice = 'contains' | '=';
export type DriveSearchField =
  | DriveSearchFieldChoice
  | 'modifiedTime'
  | 'viewedByMeTime'
  | 'createdTime'
  | 'sharedWithMeTime'
  | 'trashed'
  | 'starred'
  | 'sharedWithMe'
  | 'visibility'
  | 'shortcutDetails.targetId';
export type DriveSearchOperator =
  | DriveSearchOperatorChoice
  | '!='
  | '<'
  | '<='
  | '>'
  | '>=';
