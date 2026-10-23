import { HttpMethod } from '@activepieces/pieces-common';
import { encodeId, FormbricksAuthValue, formbricksData, formbricksRequest, isFormbricksStatus, isRecord } from './client';

async function listWorkspaces({ auth }: { auth: FormbricksAuthValue }): Promise<WorkspaceOption[]> {
  try {
    const me = await formbricksData<unknown>({ auth, method: HttpMethod.GET, path: '/api/v2/me' });
    const permissions = isRecord(me) && Array.isArray(me['workspacePermissions']) ? me['workspacePermissions'] : [];
    const fromV2 = permissions.filter(isRecord).flatMap((permission) => {
      const id = str(permission['workspaceId']);
      return id === null ? [] : [{ id, name: str(permission['workspaceName']) ?? id }];
    });
    if (fromV2.length > 0) {
      return uniqueById(fromV2);
    }
  } catch (error) {
    if (!isFormbricksStatus({ error, statuses: [400, 401, 403, 404, 405] })) {
      throw error;
    }
  }
  const legacy = await formbricksRequest<unknown>({ auth, method: HttpMethod.GET, path: '/api/v1/management/me' });
  const body = legacy.body;
  if (!isRecord(body)) {
    return [];
  }
  const workspace = isRecord(body['workspace']) ? body['workspace'] : isRecord(body['project']) ? body['project'] : undefined;
  const id = str(workspace?.['id']) ?? str(body['id']);
  if (id === null) {
    return [];
  }
  return [{ id, name: str(workspace?.['name']) ?? id }];
}

async function listSurveysPage({
  auth,
  limit,
  offset,
}: {
  auth: FormbricksAuthValue;
  limit: number;
  offset: number;
}): Promise<SurveySummary[]> {
  const data = await formbricksData<unknown>({
    auth,
    method: HttpMethod.GET,
    path: '/api/v1/management/surveys',
    query: { limit, offset },
  });
  return (Array.isArray(data) ? data : []).filter(isRecord).map(mapSurveySummary);
}

async function listAllSurveys({ auth, workspaceId }: { auth: FormbricksAuthValue; workspaceId?: string }): Promise<SurveySummary[]> {
  const { items: pages } = await collectPages({
    fetchPage: (offset) => listSurveysPage({ auth, limit: SURVEY_PAGE_SIZE, offset }),
    pageSize: SURVEY_PAGE_SIZE,
    maxItems: MAX_DROPDOWN_SURVEYS,
  });
  return workspaceId === undefined ? pages : pages.filter((survey) => survey.workspaceId === null || survey.workspaceId === workspaceId);
}

async function listSurveys({
  auth,
  workspaceId,
  status,
  limit,
}: {
  auth: FormbricksAuthValue;
  workspaceId?: string;
  status?: string;
  limit: number;
}): Promise<{ surveys: SurveySummary[]; count: number; truncated: boolean; scan_limit_reached: boolean }> {
  const { items: all, hitCap } = await collectPages({
    fetchPage: (offset) => listSurveysPage({ auth, limit: SURVEY_PAGE_SIZE, offset }),
    pageSize: SURVEY_PAGE_SIZE,
    maxItems: MAX_SCANNED_SURVEYS,
  });
  const filtered = all.filter(
    (survey) =>
      (workspaceId === undefined || survey.workspaceId === null || survey.workspaceId === workspaceId) &&
      (status === undefined || survey.status === status),
  );
  const surveys = filtered.slice(0, limit);
  return {
    surveys,
    count: surveys.length,
    truncated: filtered.length > limit || hitCap,
    scan_limit_reached: hitCap,
  };
}

async function listWorkspaceSampleResponses({
  auth,
  workspaceId,
  surveyIds,
  finishedOnly,
  sampleSize,
}: {
  auth: FormbricksAuthValue;
  workspaceId: string;
  surveyIds: string[];
  finishedOnly: boolean;
  sampleSize: number;
}): Promise<FormbricksResponse[]> {
  const scopedSurveyIds =
    surveyIds.length > 0 ? surveyIds : (await listAllSurveys({ auth, workspaceId })).map((survey) => survey.id).filter((id) => id.length > 0);
  return collectSampleResponses({
    surveyIds: scopedSurveyIds.slice(0, MAX_TEST_SURVEYS),
    finishedOnly,
    sampleSize,
    fetchSurveyResponses: async (surveyId) =>
      (await listResponses({ auth, surveyId, limit: TEST_RESPONSES_PER_SURVEY, skip: 0 })).responses,
  });
}

export async function collectSampleResponses({
  surveyIds,
  finishedOnly,
  sampleSize,
  fetchSurveyResponses,
}: {
  surveyIds: string[];
  finishedOnly: boolean;
  sampleSize: number;
  fetchSurveyResponses: (surveyId: string) => Promise<FormbricksResponse[]>;
}): Promise<FormbricksResponse[]> {
  const wanted = new Set(surveyIds);
  const merged: FormbricksResponse[] = [];
  for (let start = 0; start < surveyIds.length; start += TEST_FETCH_CONCURRENCY) {
    const batch = surveyIds.slice(start, start + TEST_FETCH_CONCURRENCY);
    const pages = await Promise.all(batch.map((surveyId) => fetchSurveyResponses(surveyId)));
    for (const page of pages) {
      merged.push(...page);
    }
  }
  const seen = new Set<string>();
  return merged
    .filter((response) => response.surveyId !== null && wanted.has(response.surveyId))
    .filter((response) => !finishedOnly || response.finished)
    .filter((response) => (seen.has(response.id) ? false : (seen.add(response.id), true)))
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, sampleSize);
}

async function getSurvey({ auth, surveyId }: { auth: FormbricksAuthValue; surveyId: string }): Promise<SurveyDetail> {
  const data = await formbricksData<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `/api/v1/management/surveys/${encodeId({ id: surveyId, label: 'Survey ID' })}`,
  });
  return mapSurveyDetail(requireRecord({ value: data, what: 'survey' }));
}

async function updateSurveyStatus({
  auth,
  surveyId,
  status,
}: {
  auth: FormbricksAuthValue;
  surveyId: string;
  status: string;
}): Promise<SurveyDetail> {
  if (!SURVEY_STATUSES.includes(status)) {
    throw new Error(`Status must be one of: ${SURVEY_STATUSES.join(', ')}.`);
  }
  const data = await formbricksData<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `/api/v1/management/surveys/${encodeId({ id: surveyId, label: 'Survey ID' })}`,
    body: { status },
  });
  return mapSurveyDetail(requireRecord({ value: data, what: 'survey' }));
}

async function listResponses({
  auth,
  surveyId,
  contactId,
  startDate,
  endDate,
  dateField,
  order,
  limit,
  skip,
}: {
  auth: FormbricksAuthValue;
  surveyId?: string;
  contactId?: string;
  startDate?: string;
  endDate?: string;
  dateField?: string;
  order?: string;
  limit: number;
  skip: number;
}): Promise<{ responses: FormbricksResponse[]; total: number | null; limit: number; skip: number; has_more: boolean }> {
  const response = await formbricksRequest<unknown>({
    auth,
    method: HttpMethod.GET,
    path: '/api/v2/management/responses',
    query: {
      surveyId,
      contactId,
      startDate,
      endDate,
      filterDateField: startDate !== undefined || endDate !== undefined ? (dateField ?? 'createdAt') : undefined,
      sortBy: dateField ?? 'createdAt',
      order: order ?? 'desc',
      limit,
      skip,
    },
  });
  const body = response.body;
  const rows = isRecord(body) && Array.isArray(body['data']) ? body['data'] : [];
  const meta = isRecord(body) && isRecord(body['meta']) ? body['meta'] : {};
  const total = typeof meta['total'] === 'number' ? meta['total'] : null;
  const responses = rows.filter(isRecord).map(mapResponse);
  return {
    responses,
    total,
    limit,
    skip,
    has_more: total === null ? responses.length === limit : skip + responses.length < total,
  };
}

async function getResponse({ auth, responseId }: { auth: FormbricksAuthValue; responseId: string }): Promise<FormbricksResponse> {
  const data = await formbricksData<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `/api/v2/management/responses/${encodeId({ id: responseId, label: 'Response ID' })}`,
  });
  return mapResponse(requireRecord({ value: data, what: 'response' }));
}

async function createResponse({
  auth,
  surveyId,
  data,
  finished,
  contactId,
  language,
}: {
  auth: FormbricksAuthValue;
  surveyId: string;
  data: Record<string, unknown>;
  finished: boolean;
  contactId?: string;
  language?: string;
}): Promise<FormbricksResponse> {
  const created = await formbricksData<unknown>({
    auth,
    method: HttpMethod.POST,
    path: '/api/v2/management/responses',
    body: {
      surveyId: surveyId.trim(),
      finished,
      data,
      language: language ?? 'default',
      ...(contactId === undefined ? {} : { contactId }),
    },
  });
  return mapResponse(requireRecord({ value: created, what: 'response' }));
}

async function updateResponse({
  auth,
  responseId,
  data,
  finished,
  language,
}: {
  auth: FormbricksAuthValue;
  responseId: string;
  data?: Record<string, unknown>;
  finished?: boolean;
  language?: string;
}): Promise<FormbricksResponse> {
  if (data === undefined && finished === undefined && language === undefined) {
    throw new Error('Provide at least one change: answers, finished or language.');
  }
  const updated = await formbricksData<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `/api/v1/management/responses/${encodeId({ id: responseId, label: 'Response ID' })}`,
    body: {
      ...(data === undefined ? {} : { data }),
      ...(finished === undefined ? {} : { finished }),
      ...(language === undefined ? {} : { language }),
    },
  });
  return mapResponse(requireRecord({ value: updated, what: 'response' }));
}

async function deleteResponse({ auth, responseId }: { auth: FormbricksAuthValue; responseId: string }): Promise<{ id: string; deleted: boolean }> {
  const id = responseId.trim();
  await formbricksRequest({
    auth,
    method: HttpMethod.DELETE,
    path: `/api/v2/management/responses/${encodeId({ id, label: 'Response ID' })}`,
  });
  return { id, deleted: true };
}

async function listAttributeKeys({ auth, workspaceId }: { auth: FormbricksAuthValue; workspaceId?: string }): Promise<AttributeKey[]> {
  const data = await formbricksData<unknown>({
    auth,
    method: HttpMethod.GET,
    path: '/api/v1/management/contact-attribute-keys',
  });
  const keys = (Array.isArray(data) ? data : []).filter(isRecord).map(mapAttributeKey);
  return workspaceId === undefined ? keys : keys.filter((key) => key.workspaceId === null || key.workspaceId === workspaceId);
}

async function createAttributeKey({
  auth,
  workspaceId,
  key,
  name,
  description,
}: {
  auth: FormbricksAuthValue;
  workspaceId: string;
  key: string;
  name?: string;
  description?: string;
}): Promise<AttributeKey> {
  const trimmedKey = key.trim();
  if (!/^[A-Za-z0-9_]+$/.test(trimmedKey)) {
    throw new Error('The attribute key may contain only letters, numbers and underscores, for example "plan" or "company_size".');
  }
  const created = await formbricksData<unknown>({
    auth,
    method: HttpMethod.POST,
    path: '/api/v2/management/contact-attribute-keys',
    body: {
      workspaceId: workspaceId.trim(),
      key: trimmedKey,
      name: name ?? trimmedKey,
      description: description ?? null,
    },
  });
  return mapAttributeKey(requireRecord({ value: created, what: 'contact attribute key' }));
}

async function findContact({
  auth,
  workspaceId,
  email,
  userId,
}: {
  auth: FormbricksAuthValue;
  workspaceId: string;
  email?: string;
  userId?: string;
}): Promise<{ found: boolean; contact: ContactRecord | null }> {
  if (email === undefined && userId === undefined) {
    throw new Error('Provide an email or a user ID to look up.');
  }
  const keys = await listAttributeKeys({ auth, workspaceId: workspaceId.trim() });
  const lookupKey = keys.find((key) => key.key === (email === undefined ? 'userId' : 'email'));
  if (lookupKey === undefined) {
    return { found: false, contact: null };
  }
  const attributes = await listContactAttributes({ auth });
  const wanted = (email ?? userId ?? '').trim();
  const match = attributes.find(
    (attribute) =>
      attribute.attributeKeyId === lookupKey.id &&
      (email === undefined ? attribute.value === wanted : attribute.value.toLowerCase() === wanted.toLowerCase()),
  );
  if (match === undefined) {
    return { found: false, contact: null };
  }
  return { found: true, contact: buildContact({ contactId: match.contactId, keys, attributes }) };
}

async function upsertContact({
  auth,
  workspaceId,
  email,
  attributes,
}: {
  auth: FormbricksAuthValue;
  workspaceId: string;
  email: string;
  attributes: Record<string, string>;
}): Promise<{ status: string; message: string; contact: ContactRecord | null }> {
  const trimmedEmail = email.trim();
  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    throw new Error('Enter a valid email address for the contact.');
  }
  const extra = Object.entries(attributes).filter(([key, value]) => key.trim().length > 0 && key !== 'email' && value.trim().length > 0);
  const result = await formbricksData<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: '/api/v2/management/contacts/bulk',
    body: {
      workspaceId: workspaceId.trim(),
      contacts: [
        {
          attributes: [
            { attributeKey: { key: 'email', name: 'Email' }, value: trimmedEmail },
            ...extra.map(([key, value]) => ({
              attributeKey: { key: key.trim(), name: DEFAULT_ATTRIBUTE_NAMES[key.trim()] ?? key.trim() },
              value: value.trim(),
            })),
          ],
        },
      ],
    },
  });
  const record = isRecord(result) ? result : {};
  const skipped = Array.isArray(record['skippedContacts']) ? record['skippedContacts'] : [];
  if (skipped.length > 0) {
    throw new Error(`Formbricks skipped the contact: ${str(record['message']) ?? 'it conflicts with an existing contact (for example the same user ID on another email).'}`);
  }
  const lookup = await findContact({ auth, workspaceId, email: trimmedEmail });
  return {
    status: str(record['status']) ?? 'success',
    message: str(record['message']) ?? '',
    contact: lookup.contact,
  };
}

async function deleteContact({ auth, contactId }: { auth: FormbricksAuthValue; contactId: string }): Promise<{ id: string; deleted: boolean }> {
  const id = contactId.trim();
  await formbricksRequest({
    auth,
    method: HttpMethod.DELETE,
    path: `/api/v1/management/contacts/${encodeId({ id, label: 'Contact ID' })}`,
  });
  return { id, deleted: true };
}

async function listActionClasses({ auth, workspaceId }: { auth: FormbricksAuthValue; workspaceId?: string }): Promise<ActionClass[]> {
  const data = await formbricksData<unknown>({
    auth,
    method: HttpMethod.GET,
    path: '/api/v1/management/action-classes',
  });
  const classes = (Array.isArray(data) ? data : []).filter(isRecord).map(mapActionClass);
  return workspaceId === undefined ? classes : classes.filter((item) => item.workspaceId === null || item.workspaceId === workspaceId);
}

async function getContactSurveyLink({
  auth,
  surveyId,
  contactId,
  expirationDays,
}: {
  auth: FormbricksAuthValue;
  surveyId: string;
  contactId: string;
  expirationDays?: number;
}): Promise<{ surveyUrl: string; expiresAt: string | null; surveyId: string; contactId: string }> {
  if (expirationDays !== undefined && (!Number.isInteger(expirationDays) || expirationDays < 1 || expirationDays > 365)) {
    throw new Error('Expiration (days) must be a whole number from 1 to 365.');
  }
  const data = await formbricksData<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `/api/v2/management/surveys/${encodeId({ id: surveyId, label: 'Survey ID' })}/contact-links/contacts/${encodeId({ id: contactId, label: 'Contact ID' })}`,
    query: { expirationDays },
  });
  const record = requireRecord({ value: data, what: 'survey link' });
  const surveyUrl = str(record['surveyUrl']);
  if (surveyUrl === null) {
    throw new Error('Formbricks did not return a survey link.');
  }
  return { surveyUrl, expiresAt: str(record['expiresAt']), surveyId: surveyId.trim(), contactId: contactId.trim() };
}

async function listContactAttributes({ auth }: { auth: FormbricksAuthValue }): Promise<ContactAttributeValue[]> {
  const data = await formbricksData<unknown>({
    auth,
    method: HttpMethod.GET,
    path: '/api/v1/management/contact-attributes',
  });
  return (Array.isArray(data) ? data : []).filter(isRecord).flatMap((row) => {
    const contactId = str(row['contactId']);
    const attributeKeyId = str(row['attributeKeyId']);
    if (contactId === null || attributeKeyId === null) {
      return [];
    }
    return [{ contactId, attributeKeyId, value: str(row['value']) ?? '' }];
  });
}

function buildContact({
  contactId,
  keys,
  attributes,
}: {
  contactId: string;
  keys: AttributeKey[];
  attributes: ContactAttributeValue[];
}): ContactRecord {
  const keyById = new Map(keys.map((key) => [key.id, key.key]));
  const values = Object.fromEntries(
    attributes
      .filter((attribute) => attribute.contactId === contactId && keyById.has(attribute.attributeKeyId))
      .map((attribute) => [keyById.get(attribute.attributeKeyId) ?? attribute.attributeKeyId, attribute.value]),
  );
  return {
    id: contactId,
    email: values['email'] ?? null,
    userId: values['userId'] ?? null,
    firstName: values['firstName'] ?? null,
    lastName: values['lastName'] ?? null,
    attributes: values,
  };
}

export async function collectPages<T>({
  fetchPage,
  pageSize,
  maxItems,
}: {
  fetchPage: (offset: number) => Promise<T[]>;
  pageSize: number;
  maxItems: number;
}): Promise<{ items: T[]; hitCap: boolean }> {
  const collected: T[] = [];
  for (let offset = 0; offset < maxItems; offset += pageSize) {
    const page = await fetchPage(offset);
    collected.push(...page);
    if (page.length < pageSize) {
      return { items: collected.slice(0, maxItems), hitCap: collected.length > maxItems };
    }
  }
  return { items: collected.slice(0, maxItems), hitCap: true };
}

function mapSurveySummary(raw: Record<string, unknown>): SurveySummary {
  const questions = surveyQuestions(raw);
  return {
    id: str(raw['id']) ?? '',
    name: str(raw['name']) ?? '',
    status: str(raw['status']) ?? '',
    type: str(raw['type']) ?? '',
    workspaceId: str(raw['workspaceId']) ?? str(raw['environmentId']),
    questionCount: questions.length,
    createdAt: str(raw['createdAt']),
    updatedAt: str(raw['updatedAt']),
  };
}

function mapSurveyDetail(raw: Record<string, unknown>): SurveyDetail {
  return {
    ...mapSurveySummary(raw),
    questions: surveyQuestions(raw).map((question) => ({
      id: str(question['id']) ?? '',
      type: str(question['type']) ?? '',
      headline: plainText(question['headline']),
      required: question['required'] === true,
    })),
  };
}

function surveyQuestions(raw: Record<string, unknown>): Record<string, unknown>[] {
  if (Array.isArray(raw['questions']) && raw['questions'].length > 0) {
    return raw['questions'].filter(isRecord);
  }
  if (Array.isArray(raw['blocks'])) {
    return raw['blocks'].filter(isRecord).flatMap((block) => (Array.isArray(block['elements']) ? block['elements'].filter(isRecord) : []));
  }
  return [];
}

function plainText(value: unknown): string {
  const text = isRecord(value) ? (str(value['default']) ?? Object.values(value).map(str).find((item) => item !== null) ?? '') : (str(value) ?? '');
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function mapResponse(raw: Record<string, unknown>): FormbricksResponse {
  return {
    id: str(raw['id']) ?? '',
    surveyId: str(raw['surveyId']),
    finished: raw['finished'] === true,
    data: isRecord(raw['data']) ? raw['data'] : {},
    variables: isRecord(raw['variables']) ? raw['variables'] : {},
    contactId: str(raw['contactId']),
    contactAttributes: isRecord(raw['contactAttributes']) ? raw['contactAttributes'] : null,
    meta: isRecord(raw['meta']) ? raw['meta'] : {},
    language: str(raw['language']),
    endingId: str(raw['endingId']),
    singleUseId: str(raw['singleUseId']),
    createdAt: str(raw['createdAt']),
    updatedAt: str(raw['updatedAt']),
  };
}

function mapAttributeKey(raw: Record<string, unknown>): AttributeKey {
  return {
    id: str(raw['id']) ?? '',
    key: str(raw['key']) ?? '',
    name: str(raw['name']),
    description: str(raw['description']),
    type: str(raw['type']),
    dataType: str(raw['dataType']),
    isUnique: raw['isUnique'] === true,
    workspaceId: str(raw['workspaceId']) ?? str(raw['environmentId']),
    createdAt: str(raw['createdAt']),
  };
}

function mapActionClass(raw: Record<string, unknown>): ActionClass {
  return {
    id: str(raw['id']) ?? '',
    name: str(raw['name']) ?? '',
    description: str(raw['description']),
    type: str(raw['type']) ?? '',
    key: str(raw['key']),
    workspaceId: str(raw['workspaceId']) ?? str(raw['environmentId']),
    createdAt: str(raw['createdAt']),
  };
}

function requireRecord({ value, what }: { value: unknown; what: string }): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`Formbricks returned an unexpected ${what}.`);
  }
  return value;
}

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function uniqueById(items: WorkspaceOption[]): WorkspaceOption[] {
  return items.filter((item, index) => items.findIndex((other) => other.id === item.id) === index);
}

const SURVEY_PAGE_SIZE = 100;
const MAX_DROPDOWN_SURVEYS = 500;

const MAX_TEST_SURVEYS = 25;

const TEST_RESPONSES_PER_SURVEY = 10;

const TEST_FETCH_CONCURRENCY = 5;
const MAX_SCANNED_SURVEYS = 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_ATTRIBUTE_NAMES: Record<string, string> = {
  userId: 'User Id',
  firstName: 'First Name',
  lastName: 'Last Name',
  language: 'Language',
};

export const SURVEY_STATUSES = ['inProgress', 'paused', 'completed'];

export const formbricksApi = {
  listWorkspaces,
  listAllSurveys,
  listSurveys,
  listWorkspaceSampleResponses,
  getSurvey,
  updateSurveyStatus,
  listResponses,
  getResponse,
  createResponse,
  updateResponse,
  deleteResponse,
  listAttributeKeys,
  createAttributeKey,
  findContact,
  upsertContact,
  deleteContact,
  listActionClasses,
  getContactSurveyLink,
  mapResponse,
};

export type WorkspaceOption = { id: string; name: string };

export type SurveySummary = {
  id: string;
  name: string;
  status: string;
  type: string;
  workspaceId: string | null;
  questionCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SurveyDetail = SurveySummary & {
  questions: { id: string; type: string; headline: string; required: boolean }[];
};

export type FormbricksResponse = {
  id: string;
  surveyId: string | null;
  finished: boolean;
  data: Record<string, unknown>;
  variables: Record<string, unknown>;
  contactId: string | null;
  contactAttributes: Record<string, unknown> | null;
  meta: Record<string, unknown>;
  language: string | null;
  endingId: string | null;
  singleUseId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AttributeKey = {
  id: string;
  key: string;
  name: string | null;
  description: string | null;
  type: string | null;
  dataType: string | null;
  isUnique: boolean;
  workspaceId: string | null;
  createdAt: string | null;
};

export type ActionClass = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  key: string | null;
  workspaceId: string | null;
  createdAt: string | null;
};

export type ContactRecord = {
  id: string;
  email: string | null;
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
  attributes: Record<string, string>;
};

type ContactAttributeValue = { contactId: string; attributeKeyId: string; value: string };
