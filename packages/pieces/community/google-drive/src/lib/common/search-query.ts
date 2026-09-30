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
  const clauses = [
    `${queryTerm} ${operator} '${common.escapeDriveQueryLiteral(query)}'`,
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
