import { HttpMethod } from '@activepieces/pieces-common';
import { AconexAuthProps, assertAuthProps } from './auth-props';
import {
  ACONEX_API_BASE,
  assertProjectsPath,
  assertSafeApiPath,
  getAccessToken,
  sendAconex,
} from './client';
import { AconexError } from './errors';
import { assertNumericId, normalizeMailBox, resolvePageNumber, resolvePageSize } from './input';
import { MAX_XML_BYTES, isXmlRecord, parseAconexXml, xmlChildren, xmlText, type XmlRecord } from './xml';

export const ACCEPT_XML = 'application/xml';
export const ACCEPT_MAIL_V2 = 'application/vnd.aconex.mail.v2+xml';
export const DEFAULT_MAIL_RETURN_FIELDS = 'subject,docno,sentdate,fromUserDetails,tostatusid,confidential';
export const DEFAULT_DOCUMENT_RETURN_FIELDS =
  'docno,title,revision,doctype,author,filename,fileSize,fileType,trackingid,registered,versionnumber';

const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export async function fetchProjectsDocument(auth: AconexAuthProps): Promise<unknown> {
  return aconexGetXml(auth, '/projects', {}, ACCEPT_XML);
}

export function projectRows(document: unknown): XmlRecord[] {
  const root = isXmlRecord(document) ? document : {};
  const results = isXmlRecord(root['ProjectResults']) ? root['ProjectResults'] : {};
  const search = isXmlRecord(results['SearchResults']) ? results['SearchResults'] : {};
  return xmlChildren(search['Project']).filter((project) => xmlText(project['ProjectId']).length > 0);
}

export async function listProjectMail(
  auth: AconexAuthProps,
  input: {
    projectId: string;
    mailBox: string;
    searchQuery?: string;
    pageSize?: number;
    pageNumber?: number;
    returnFields?: string;
  },
): Promise<unknown> {
  const projectId = assertNumericId(input.projectId, 'Project');
  const query: Record<string, string> = {
    mail_box: normalizeMailBox(input.mailBox, 'lower'),
    search_type: 'PAGED',
    page_size: String(resolvePageSize(input.pageSize)),
    page_number: String(resolvePageNumber(input.pageNumber)),
    sort_field: 'sentdate',
    sort_direction: 'DESC',
    return_fields: input.returnFields?.trim() || DEFAULT_MAIL_RETURN_FIELDS,
  };
  const search = input.searchQuery?.trim();
  if (search) {
    query['search_query'] = search;
  }
  return aconexGetXml(auth, `/projects/${projectId}/mail`, query, ACCEPT_MAIL_V2);
}

export async function getMail(auth: AconexAuthProps, projectId: string, mailId: string): Promise<unknown> {
  const project = assertNumericId(projectId, 'Project');
  const mail = assertNumericId(mailId, 'Mail');
  return aconexGetXml(auth, `/projects/${project}/mail/${mail}`, {}, ACCEPT_MAIL_V2);
}

export async function listDocuments(
  auth: AconexAuthProps,
  input: {
    projectId: string;
    searchQuery?: string;
    pageSize?: number;
    pageNumber?: number;
    returnFields?: string;
  },
): Promise<unknown> {
  const projectId = assertNumericId(input.projectId, 'Project');
  const query: Record<string, string> = {
    search_type: 'PAGED',
    page_size: String(resolvePageSize(input.pageSize)),
    page_number: String(resolvePageNumber(input.pageNumber)),
    sort_field: 'registered',
    sort_direction: 'DESC',
    return_fields: input.returnFields?.trim() || DEFAULT_DOCUMENT_RETURN_FIELDS,
    show_document_history: 'false',
  };
  const search = input.searchQuery?.trim();
  if (search) {
    query['search_query'] = search;
  }
  return aconexGetXml(auth, `/projects/${projectId}/register`, query, ACCEPT_XML);
}

export async function getDocumentMetadata(
  auth: AconexAuthProps,
  projectId: string,
  documentId: string,
): Promise<unknown> {
  const project = assertNumericId(projectId, 'Project');
  const document = assertNumericId(documentId, 'Document');
  return aconexGetXml(auth, `/projects/${project}/register/${document}/metadata`, {
    sanitizeInvalidXmlCharacters: 'true',
  }, ACCEPT_XML);
}

export async function fetchMailIntegrity(
  auth: AconexAuthProps,
  projectId: string,
  sinceHour: string,
  mailBox: string,
): Promise<unknown> {
  const project = assertNumericId(projectId, 'Project');
  return aconexGetXml(auth, `/projects/${project}/mail/integrity`, {
    everythingsince: sinceHour,
    mail_box: normalizeMailBox(mailBox, 'upper'),
  }, ACCEPT_MAIL_V2);
}

export async function fetchDocumentIntegrity(
  auth: AconexAuthProps,
  projectId: string,
  sinceHour: string,
): Promise<unknown> {
  const project = assertNumericId(projectId, 'Project');
  return aconexGetXml(auth, `/projects/${project}/register/integrity`, {
    everythingsince: sinceHour,
    show_document_history: 'true',
  }, ACCEPT_XML);
}

export async function customAconexCall(
  authInput: AconexAuthProps,
  input: {
    method: string;
    path: string;
    queryParams?: Record<string, unknown>;
    headers?: Record<string, unknown>;
    body?: string;
  },
): Promise<unknown> {
  assertSafeApiPath(input.path);
  const method = input.method.trim().toUpperCase();
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].includes(method)) {
    throw new AconexError('INVALID_METHOD', 'Choose a supported HTTP method.');
  }
  const auth = assertAuthProps(authInput);
  const token = await getAccessToken(auth);
  const headers = toStringRecord(input.headers);
  delete headers['Authorization'];
  delete headers['authorization'];
  headers['Authorization'] = `Bearer ${token}`;
  const response = await sendAconex({
    method: method as HttpMethod,
    url: `${ACONEX_API_BASE}${input.path.startsWith('/') ? input.path : `/${input.path}`}`,
    queryParams: toQuery(input.queryParams),
    headers,
    body: METHODS_WITH_BODY.has(method) ? input.body : undefined,
    timeout: 30_000,
    responseType: 'text',
    followRedirects: false,
  });
  return interpretBody(response.body);
}

async function aconexGetXml(
  authInput: AconexAuthProps,
  path: string,
  query: Record<string, string>,
  accept: string,
): Promise<unknown> {
  assertProjectsPath(path);
  const auth = assertAuthProps(authInput);
  const token = await getAccessToken(auth);
  const response = await sendAconex({
    method: HttpMethod.GET,
    url: `${ACONEX_API_BASE}${path}`,
    queryParams: query,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: accept,
    },
    timeout: 30_000,
    responseType: 'text',
    followRedirects: false,
  });
  if (typeof response.body !== 'string' || response.body.trim().length === 0) {
    throw new AconexError('EMPTY_RESPONSE', 'Aconex returned an empty response.');
  }
  return parseAconexXml(response.body);
}

function interpretBody(body: unknown): unknown {
  if (typeof body !== 'string') {
    return body;
  }
  if (body.length > MAX_XML_BYTES || Buffer.byteLength(body, 'utf8') > MAX_XML_BYTES) {
    throw new AconexError('RESPONSE_TOO_LARGE', 'The Aconex response is larger than 20 MB and was not parsed.');
  }
  const trimmed = body.replace(/^\uFEFF/, '').trim();
  if (trimmed.startsWith('<')) {
    return parseAconexXml(body);
  }
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return body;
    }
  }
  return body;
}

function toQuery(input: Record<string, unknown> | undefined): Record<string, string> {
  const query: Record<string, string> = {};
  if (!input) {
    return query;
  }
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) {
      continue;
    }
    query[key] = String(value);
  }
  return query;
}

function toStringRecord(input: Record<string, unknown> | undefined): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!input) {
    return headers;
  }
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) {
      continue;
    }
    headers[key] = String(value);
  }
  return headers;
}
