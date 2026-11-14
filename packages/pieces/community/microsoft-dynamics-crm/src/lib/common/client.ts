import {
  AuthenticationType,
  HttpError,
  HttpHeaders,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import {
  EntityAttributeType,
  MAX_FETCHXML_URL_LENGTH,
  REQUEST_TIMEOUT_MS,
} from './constants';
import { dynamicsHostUrl } from './host-url';
import { odata } from './odata';
import {
  CollectionRelationship,
  DynamicsAuthValue,
  EntityAttribute,
  EntityAttributeOptionsResponse,
  EntityAttributeResponse,
  EntityDefinition,
  EntityOptionAttributesResponse,
  EntityTypeResponse,
  LocalizedLabel,
  ManyToManyRelationship,
  ManyToOneRelationship,
  OneToManyRelationship,
  OptionMetadata,
  OptionValue,
  RecordPage,
  WhoAmIResponse,
} from './types';

const MAX_RATE_LIMIT_RETRIES = 2;
const MAX_RETRY_WAIT_SECONDS = 30;
let verifiedTlsAgent: Promise<unknown> | undefined;
const ENTITY_SELECT = [
  'LogicalName',
  'EntitySetName',
  'PrimaryIdAttribute',
  'PrimaryNameAttribute',
  'DisplayName',
  'IsCustomizable',
  'HasNotes',
  'HasActivities',
].join(',');
const FORMATTED_PREFER = 'odata.include-annotations="OData.Community.Display.V1.FormattedValue,Microsoft.Dynamics.CRM.lookuplogicalname"';

class DynamicsApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ operation, status, responseBody }: ApiErrorParams) {
    super(`Dynamics 365 ${operation} failed (HTTP ${status}): ${vendorMessage(responseBody)}`);
    this.name = 'DynamicsApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

function vendorMessage(responseBody: unknown): string {
  if (typeof responseBody === 'string') {
    const trimmed = responseBody.trim();
    return trimmed === '' ? 'no error details returned' : trimmed.slice(0, 500);
  }
  if (odata.isRecord(responseBody)) {
    const error = responseBody['error'];
    if (odata.isRecord(error) && typeof error['message'] === 'string') {
      const code = typeof error['code'] === 'string' && error['code'] !== '' ? ` (code ${error['code']})` : '';
      return `${error['message'].slice(0, 500)}${code}`;
    }
    return JSON.stringify(responseBody).slice(0, 500);
  }
  return 'no error details returned';
}

function labelText(label: LocalizedLabel | undefined): string | undefined {
  const text = label?.UserLocalizedLabel?.Label;
  return typeof text === 'string' && text !== '' ? text : undefined;
}

function toOptionValues(options: OptionMetadata[] | undefined): OptionValue[] {
  return (options ?? []).map((option) => ({
    value: option.Value,
    label: labelText(option.Label) ?? String(option.Value),
  }));
}

function verifiedTlsDispatcher(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

function retryDelayMs(attempt: number): number {
  return Math.min(2 ** (attempt + 1), MAX_RETRY_WAIT_SECONDS) * 1000;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class DynamicsCRMClient {
  private readonly accessToken: string;
  private readonly hostUrl: unknown;
  private readonly proxyUrl: unknown;

  constructor({ hostUrl, accessToken, proxyUrl }: ClientParams) {
    this.hostUrl = hostUrl;
    this.accessToken = accessToken;
    this.proxyUrl = proxyUrl;
  }

  apiBaseUrl(): string {
    return dynamicsHostUrl.getApiBaseUrl({ hostUrl: this.hostUrl, proxyUrl: this.proxyUrl });
  }

  environmentApiUrl(): string {
    return dynamicsHostUrl.getEnvironmentApiUrl(this.hostUrl);
  }

  relativeFromNextLink(nextLink: string): string {
    let url: URL;
    try {
      url = new URL(nextLink);
    } catch {
      throw new Error('The next page link is not a valid URL. Pass the nextLink value returned by the previous search unchanged.');
    }
    const allowed = [this.environmentApiUrl(), this.apiBaseUrl()].map((base) => new URL(base));
    for (const base of allowed) {
      const prefix = `${base.pathname}/`;
      if (url.origin.toLowerCase() === base.origin.toLowerCase() && url.pathname.startsWith(prefix) && url.username === '' && url.password === '') {
        const rest = url.pathname.slice(prefix.length - 1);
        if (rest.split('/').some((part) => part === '..')) {
          break;
        }
        return `${rest}${url.search}`;
      }
    }
    throw new Error('The next page link does not belong to this Dynamics 365 environment. Pass the nextLink value returned by the previous search unchanged.');
  }

  async request<T>({ method, path, query, headers, body, operation }: RequestParams): Promise<ApiResponse<T>> {
    if (!path.startsWith('/') || path.startsWith('//')) {
      throw new Error(`Internal error: Dynamics 365 path must be relative (${operation}).`);
    }
    const url = `${this.apiBaseUrl()}${path}`;
    const dispatcher = await dynamicsClientInternals.verifiedTlsDispatcher();
    for (let attempt = 0; ; attempt++) {
      try {
        const response = await httpClient.sendRequest<T>({
          method,
          url,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: this.accessToken,
          },
          headers: {
            Accept: 'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
            'Content-Type': 'application/json; charset=utf-8',
            ...headers,
          },
          queryParams: query,
          body,
          timeout: REQUEST_TIMEOUT_MS,
          followRedirects: false,
          redactBodyInErrors: true,
        }, { dispatcher });
        return { status: response.status, headers: response.headers, body: response.body };
      } catch (error) {
        if (error instanceof HttpError) {
          const status = error.response.status;
          if (status === 429 && method === HttpMethod.GET && attempt < MAX_RATE_LIMIT_RETRIES) {
            await dynamicsClientInternals.sleep(retryDelayMs(attempt));
            continue;
          }
          throw new DynamicsApiError({ operation, status, responseBody: error.response.body });
        }
        const mayHaveApplied = method !== HttpMethod.GET;
        const reason = error instanceof Error ? error.message.slice(0, 200) : 'unknown error';
        throw new Error(
          `Dynamics 365 ${operation} did not complete: the environment could not be reached or did not answer in time (${reason}).${mayHaveApplied ? ' The change may still have been applied; check the record before retrying.' : ''}`
        );
      }
    }
  }

  async listEntities(): Promise<EntityDefinition[]> {
    const res = await this.request<EntityTypeResponse>({
      method: HttpMethod.GET,
      path: '/EntityDefinitions',
      query: { $select: ENTITY_SELECT },
      operation: 'list entities',
    });
    return res.body.value
      .filter((entity) => typeof entity.EntitySetName === 'string' && entity.EntitySetName !== '')
      .sort((a, b) => entityLabel(a).localeCompare(entityLabel(b)));
  }

  async getEntityBySetName(entitySet: string): Promise<EntityDefinition> {
    const set = odata.requireIdentifier({ value: entitySet, label: 'Entity set name' });
    const res = await this.request<EntityTypeResponse>({
      method: HttpMethod.GET,
      path: '/EntityDefinitions',
      query: { $select: ENTITY_SELECT, $filter: `EntitySetName eq '${odata.escapeString(set)}'` },
      operation: 'look up entity',
    });
    const entity = res.body.value[0];
    if (!entity) {
      throw new Error(`No Dynamics 365 table has the entity set name "${set}". Entity set names are plural, for example contacts, accounts or opportunities.`);
    }
    return entity;
  }

  async getEntity(nameOrSet: string): Promise<EntityDefinition> {
    const name = odata.requireIdentifier({ value: nameOrSet, label: 'Entity name' });
    const res = await this.request<EntityTypeResponse>({
      method: HttpMethod.GET,
      path: '/EntityDefinitions',
      query: {
        $select: ENTITY_SELECT,
        $filter: `LogicalName eq '${name.toLowerCase()}' or EntitySetName eq '${name}'`,
      },
      operation: 'look up entity',
    });
    const entity = res.body.value[0];
    if (!entity) {
      throw new Error(`No Dynamics 365 table is named "${name}". Use a logical name such as contact or an entity set name such as contacts.`);
    }
    return entity;
  }

  async listAttributes(logicalName: string): Promise<EntityAttribute[]> {
    const res = await this.request<EntityAttributeResponse>({
      method: HttpMethod.GET,
      path: `/EntityDefinitions(LogicalName='${odata.requireIdentifier({ value: logicalName, label: 'Entity logical name' })}')/Attributes`,
      query: {
        $select: [
          'AttributeType',
          'LogicalName',
          'AttributeOf',
          'Description',
          'DisplayName',
          'IsPrimaryName',
          'IsValidForCreate',
          'IsValidForUpdate',
          'IsValidForRead',
          'RequiredLevel',
        ].join(','),
      },
      operation: 'list columns',
    });
    return res.body.value;
  }

  async fetchOptionFieldValues({ logicalName, attribute, attributeType }: OptionFieldParams): Promise<OptionValue[]> {
    const res = await this.request<EntityAttributeOptionsResponse>({
      method: HttpMethod.GET,
      path: `/EntityDefinitions(LogicalName='${odata.requireIdentifier({ value: logicalName, label: 'Entity logical name' })}')/Attributes(LogicalName='${odata.requireIdentifier({ value: attribute, label: 'Column name' })}')/Microsoft.Dynamics.CRM.${attributeType}AttributeMetadata`,
      query: {
        $select: 'LogicalName',
        $expand: 'OptionSet($select=Options),GlobalOptionSet($select=Options)',
      },
      operation: 'list option values',
    });
    const optionSet = res.body.OptionSet ?? res.body.GlobalOptionSet;
    return toOptionValues(optionSet?.Options);
  }

  async fetchAllOptionValues(logicalName: string): Promise<Record<string, OptionValue[]>> {
    const name = odata.requireIdentifier({ value: logicalName, label: 'Entity logical name' });
    const result: Record<string, OptionValue[]> = {};
    const kinds = [
      { cast: 'PicklistAttributeMetadata', expand: 'OptionSet($select=Options),GlobalOptionSet($select=Options)' },
      { cast: 'MultiSelectPicklistAttributeMetadata', expand: 'OptionSet($select=Options),GlobalOptionSet($select=Options)' },
      { cast: 'StateAttributeMetadata', expand: 'OptionSet($select=Options)' },
      { cast: 'StatusAttributeMetadata', expand: 'OptionSet($select=Options)' },
    ];
    for (const kind of kinds) {
      const res = await this.request<EntityOptionAttributesResponse>({
        method: HttpMethod.GET,
        path: `/EntityDefinitions(LogicalName='${name}')/Attributes/Microsoft.Dynamics.CRM.${kind.cast}`,
        query: { $select: 'LogicalName', $expand: kind.expand },
        operation: 'list option values',
      });
      for (const attribute of res.body.value) {
        if (typeof attribute.LogicalName !== 'string') {
          continue;
        }
        const optionSet = attribute.OptionSet ?? attribute.GlobalOptionSet;
        result[attribute.LogicalName] = toOptionValues(optionSet?.Options);
      }
    }
    return result;
  }

  async listDateOnlyColumns(logicalName: string): Promise<string[]> {
    const res = await this.request<{ value: DateTimeAttribute[] }>({
      method: HttpMethod.GET,
      path: `/EntityDefinitions(LogicalName='${odata.requireIdentifier({ value: logicalName, label: 'Entity logical name' })}')/Attributes/Microsoft.Dynamics.CRM.DateTimeAttributeMetadata`,
      query: { $select: 'LogicalName,Format,DateTimeBehavior' },
      operation: 'list date columns',
    });
    return res.body.value
      .filter((attribute) => attribute.Format === 'DateOnly' || attribute.DateTimeBehavior?.Value === 'DateOnly')
      .map((attribute) => attribute.LogicalName);
  }

  async listManyToOne(logicalName: string): Promise<ManyToOneRelationship[]> {
    const res = await this.request<{ value: ManyToOneRelationship[] }>({
      method: HttpMethod.GET,
      path: `/EntityDefinitions(LogicalName='${odata.requireIdentifier({ value: logicalName, label: 'Entity logical name' })}')/ManyToOneRelationships`,
      query: { $select: 'SchemaName,ReferencingAttribute,ReferencingEntityNavigationPropertyName,ReferencedEntity' },
      operation: 'list lookup relationships',
    });
    return res.body.value;
  }

  async listCollectionRelationships(logicalName: string): Promise<CollectionRelationship[]> {
    const name = odata.requireIdentifier({ value: logicalName, label: 'Entity logical name' });
    const oneToMany = await this.request<{ value: OneToManyRelationship[] }>({
      method: HttpMethod.GET,
      path: `/EntityDefinitions(LogicalName='${name}')/OneToManyRelationships`,
      query: { $select: 'SchemaName,ReferencingEntity,ReferencingAttribute,ReferencedEntityNavigationPropertyName' },
      operation: 'list relationships',
    });
    const manyToMany = await this.request<{ value: ManyToManyRelationship[] }>({
      method: HttpMethod.GET,
      path: `/EntityDefinitions(LogicalName='${name}')/ManyToManyRelationships`,
      query: { $select: 'SchemaName,Entity1LogicalName,Entity2LogicalName,Entity1NavigationPropertyName,Entity2NavigationPropertyName' },
      operation: 'list relationships',
    });
    const result: CollectionRelationship[] = oneToMany.body.value.map((rel) => ({
      navigationProperty: rel.ReferencedEntityNavigationPropertyName,
      targetEntity: rel.ReferencingEntity,
      schemaName: rel.SchemaName,
      kind: 'one_to_many',
    }));
    for (const rel of manyToMany.body.value) {
      if (rel.Entity1LogicalName === name) {
        result.push({ navigationProperty: rel.Entity1NavigationPropertyName, targetEntity: rel.Entity2LogicalName, schemaName: rel.SchemaName, kind: 'many_to_many' });
      }
      if (rel.Entity2LogicalName === name) {
        result.push({ navigationProperty: rel.Entity2NavigationPropertyName, targetEntity: rel.Entity1LogicalName, schemaName: rel.SchemaName, kind: 'many_to_many' });
      }
    }
    return result.sort((a, b) => a.navigationProperty.localeCompare(b.navigationProperty));
  }

  async findLookupNavigationProperty({ entityLogicalName, attribute, targetLogicalName }: LookupNavParams): Promise<string> {
    const relationships = await this.listManyToOne(entityLogicalName);
    const match = relationships.find(
      (rel) => rel.ReferencingAttribute === attribute && rel.ReferencedEntity === targetLogicalName
    );
    if (!match) {
      throw new Error(
        `A ${entityLogicalName} cannot be linked to a ${targetLogicalName} record through ${attribute}. Enable notes or activities for that table in Dynamics 365, or pick another table.`
      );
    }
    return match.ReferencingEntityNavigationPropertyName;
  }

  async listRecords({ entitySet, filter, select, orderby, pageSize, nextLink, formatted }: ListRecordsParams): Promise<RecordPage> {
    const prefer = [`odata.maxpagesize=${pageSize}`];
    if (formatted) {
      prefer.push(FORMATTED_PREFER);
    }
    const headers = { Prefer: prefer.join(',') };
    let path: string;
    let query: Record<string, string> | undefined;
    if (nextLink !== undefined && nextLink !== '') {
      path = this.relativeFromNextLink(nextLink);
      query = undefined;
    } else {
      path = `/${odata.requireIdentifier({ value: entitySet, label: 'Entity set name' })}`;
      query = {};
      if (filter) {
        query['$filter'] = filter;
      }
      if (select && select.length > 0) {
        query['$select'] = select.join(',');
      }
      if (orderby) {
        query['$orderby'] = orderby;
      }
    }
    const res = await this.request<{ value?: Record<string, unknown>[]; '@odata.nextLink'?: string }>({
      method: HttpMethod.GET,
      path,
      query,
      headers,
      operation: 'search records',
    });
    const records = (res.body.value ?? []).map((record) => odata.flattenRecord(record));
    const link = res.body['@odata.nextLink'];
    return { records, nextLink: typeof link === 'string' ? link : null, hasMore: typeof link === 'string' };
  }

  async runFetchXml({ entitySet, fetchXml }: { entitySet: string; fetchXml: string }): Promise<FetchXmlPage> {
    const set = odata.requireIdentifier({ value: entitySet, label: 'Entity set name' });
    const encoded = encodeURIComponent(fetchXml);
    if (encoded.length > MAX_FETCHXML_URL_LENGTH) {
      throw new Error('The FetchXML query is too long for a request URL (about 32 KB after encoding). Shorten the query.');
    }
    const res = await this.request<Record<string, unknown>>({
      method: HttpMethod.GET,
      path: `/${set}?fetchXml=${encoded}`,
      headers: { Prefer: 'odata.include-annotations="*"' },
      operation: 'run FetchXML',
    });
    const value = res.body['value'];
    const records = Array.isArray(value)
      ? value.filter(odata.isRecord).map((record) => odata.flattenRecord(record))
      : [];
    const moreRecords = res.body['@Microsoft.Dynamics.CRM.morerecords'] === true;
    const cookie = res.body['@Microsoft.Dynamics.CRM.fetchxmlpagingcookie'];
    return { records, moreRecords, pagingCookie: typeof cookie === 'string' ? extractPagingCookie(cookie) : null };
  }

  async getRecord({ entitySet, recordId, select, formatted }: GetRecordParams): Promise<Record<string, unknown>> {
    const query: Record<string, string> = {};
    if (select && select.length > 0) {
      query['$select'] = select.join(',');
    }
    const res = await this.request<Record<string, unknown>>({
      method: HttpMethod.GET,
      path: this.recordPath({ entitySet, recordId }),
      query,
      headers: formatted ? { Prefer: FORMATTED_PREFER } : undefined,
      operation: 'get record',
    });
    return res.body;
  }

  async createRecord({ entitySet, fields }: WriteRecordParams): Promise<Record<string, unknown>> {
    const res = await this.request<Record<string, unknown>>({
      method: HttpMethod.POST,
      path: `/${odata.requireIdentifier({ value: entitySet, label: 'Entity set name' })}`,
      headers: { Prefer: 'return=representation' },
      body: fields,
      operation: 'create record',
    });
    return res.body;
  }

  async updateRecord({ entitySet, recordId, fields }: WriteRecordParams & { recordId: string }): Promise<Record<string, unknown>> {
    const res = await this.request<Record<string, unknown>>({
      method: HttpMethod.PATCH,
      path: this.recordPath({ entitySet, recordId }),
      headers: { Prefer: 'return=representation', 'If-Match': '*' },
      body: fields,
      operation: 'update record',
    });
    return res.body;
  }

  async deleteRecord({ entitySet, recordId }: RecordRef): Promise<void> {
    await this.request<unknown>({
      method: HttpMethod.DELETE,
      path: this.recordPath({ entitySet, recordId }),
      operation: 'delete record',
    });
  }

  async associate({ entitySet, recordId, navigationProperty, relatedEntitySet, relatedRecordId }: AssociateParams): Promise<void> {
    const nav = odata.requireIdentifier({ value: navigationProperty, label: 'Relationship' });
    const relatedPath = this.recordPath({ entitySet: relatedEntitySet, recordId: relatedRecordId });
    await this.request<unknown>({
      method: HttpMethod.POST,
      path: `${this.recordPath({ entitySet, recordId })}/${nav}/$ref`,
      body: { '@odata.id': `${this.environmentApiUrl()}${relatedPath}` },
      operation: 'associate records',
    });
  }

  async disassociate({ entitySet, recordId, navigationProperty, relatedRecordId }: Omit<AssociateParams, 'relatedEntitySet'>): Promise<void> {
    const nav = odata.requireIdentifier({ value: navigationProperty, label: 'Relationship' });
    const relatedId = odata.requireGuid({ value: relatedRecordId, label: 'Related record ID' });
    await this.request<unknown>({
      method: HttpMethod.DELETE,
      path: `${this.recordPath({ entitySet, recordId })}/${nav}(${relatedId})/$ref`,
      operation: 'disassociate records',
    });
  }

  async whoAmI(): Promise<WhoAmIResponse> {
    const res = await this.request<WhoAmIResponse>({
      method: HttpMethod.GET,
      path: '/WhoAmI()',
      operation: 'WhoAmI',
    });
    return res.body;
  }

  async qualifyLead({ leadId, createAccount, createContact, createOpportunity, existingAccountId }: QualifyLeadParams): Promise<Record<string, unknown>[]> {
    const body: Record<string, unknown> = {
      CreateAccount: createAccount,
      CreateContact: createContact,
      CreateOpportunity: createOpportunity,
      Status: 3,
    };
    if (existingAccountId !== undefined) {
      body['OpportunityCustomerId'] = {
        '@odata.type': 'Microsoft.Dynamics.CRM.account',
        accountid: odata.requireGuid({ value: existingAccountId, label: 'Existing account ID' }),
      };
    }
    const res = await this.request<{ value?: Record<string, unknown>[] }>({
      method: HttpMethod.POST,
      path: `${this.recordPath({ entitySet: 'leads', recordId: leadId })}/Microsoft.Dynamics.CRM.QualifyLead`,
      body,
      operation: 'qualify lead',
    });
    return res.body.value ?? [];
  }

  async closeOpportunity({ opportunityId, outcome, status, subject, actualRevenue, description, closeDate }: CloseOpportunityParams): Promise<void> {
    const id = odata.requireGuid({ value: opportunityId, label: 'Opportunity ID' });
    const close: Record<string, unknown> = odata.compactFields({
      subject,
      actualrevenue: actualRevenue,
      description,
      actualend: closeDate,
      'opportunityid@odata.bind': odata.bindPath({ entitySet: 'opportunities', id }),
    });
    await this.request<unknown>({
      method: HttpMethod.POST,
      path: outcome === 'won' ? '/WinOpportunity' : '/LoseOpportunity',
      body: { Status: status, OpportunityClose: close },
      operation: outcome === 'won' ? 'win opportunity' : 'lose opportunity',
    });
  }

  async addNote({ regardingEntitySet, regardingId, subject, text, file }: AddNoteParams): Promise<Record<string, unknown>> {
    const entity = await this.getEntityBySetName(regardingEntitySet);
    const id = odata.requireGuid({ value: regardingId, label: 'Regarding record ID' });
    const nav = await this.findLookupNavigationProperty({
      entityLogicalName: 'annotation',
      attribute: 'objectid',
      targetLogicalName: entity.LogicalName,
    });
    const body: Record<string, unknown> = odata.compactFields({
      subject,
      notetext: text,
      [`${nav}@odata.bind`]: odata.bindPath({ entitySet: odata.requireIdentifier({ value: regardingEntitySet, label: 'Entity set name' }), id }),
    });
    if (file) {
      body['filename'] = file.filename;
      body['documentbody'] = file.base64;
      body['isdocument'] = true;
      if (file.mimeType) {
        body['mimetype'] = file.mimeType;
      }
    }
    const record = await this.createRecord({ entitySet: 'annotations', fields: body });
    return odata.flattenRecord(record);
  }

  async createTask({ regardingEntitySet, regardingId, subject, description, dueDate, priority, ownerId }: CreateTaskParams): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = odata.compactFields({
      subject,
      description,
      scheduledend: dueDate,
      prioritycode: priority,
    });
    if (regardingEntitySet !== undefined || regardingId !== undefined) {
      if (regardingEntitySet === undefined || regardingId === undefined) {
        throw new Error('Set both the regarding entity and the regarding record, or neither.');
      }
      const entity = await this.getEntityBySetName(regardingEntitySet);
      const id = odata.requireGuid({ value: regardingId, label: 'Regarding record ID' });
      const nav = await this.findLookupNavigationProperty({
        entityLogicalName: 'task',
        attribute: 'regardingobjectid',
        targetLogicalName: entity.LogicalName,
      });
      body[`${nav}@odata.bind`] = odata.bindPath({ entitySet: odata.requireIdentifier({ value: regardingEntitySet, label: 'Entity set name' }), id });
    }
    if (ownerId !== undefined) {
      body['ownerid@odata.bind'] = odata.bindPath({ entitySet: 'systemusers', id: odata.requireGuid({ value: ownerId, label: 'Owner ID' }) });
    }
    const record = await this.createRecord({ entitySet: 'tasks', fields: body });
    return odata.flattenRecord(record);
  }

  private recordPath({ entitySet, recordId }: RecordRef): string {
    const set = odata.requireIdentifier({ value: entitySet, label: 'Entity set name' });
    const id = odata.requireGuid({ value: recordId, label: 'Record ID' });
    return `/${set}(${id})`;
  }
}

function extractPagingCookie(annotation: string): string {
  const match = /pagingcookie="([^"]*)"/.exec(annotation);
  if (!match) {
    return annotation;
  }
  try {
    return decodeURIComponent(decodeURIComponent(match[1]));
  } catch {
    return match[1];
  }
}

function entityLabel(entity: EntityDefinition): string {
  return labelText(entity.DisplayName) ?? entity.LogicalName;
}

function makeClient(auth: DynamicsAuthValue): DynamicsCRMClient {
  return new DynamicsCRMClient({
    hostUrl: auth.props?.['hostUrl'],
    accessToken: auth.access_token,
    proxyUrl: auth.props?.['proxyUrl'],
  });
}

type ApiErrorParams = {
  operation: string;
  status: number;
  responseBody: unknown;
};

type ClientParams = {
  hostUrl: unknown;
  accessToken: string;
  proxyUrl?: unknown;
};

type RequestParams = {
  method: HttpMethod;
  path: string;
  operation: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: unknown;
};

type ApiResponse<T> = {
  status: number;
  headers?: HttpHeaders;
  body: T;
};

type OptionFieldParams = {
  logicalName: string;
  attribute: string;
  attributeType: EntityAttributeType;
};

type LookupNavParams = {
  entityLogicalName: string;
  attribute: string;
  targetLogicalName: string;
};

type ListRecordsParams = {
  entitySet: string;
  pageSize: number;
  filter?: string;
  select?: string[];
  orderby?: string;
  nextLink?: string;
  formatted?: boolean;
};

type FetchXmlPage = {
  records: Record<string, unknown>[];
  moreRecords: boolean;
  pagingCookie: string | null;
};

type RecordRef = {
  entitySet: string;
  recordId: string;
};

type GetRecordParams = RecordRef & {
  select?: string[];
  formatted?: boolean;
};

type WriteRecordParams = {
  entitySet: string;
  fields: Record<string, unknown>;
};

type AssociateParams = RecordRef & {
  navigationProperty: string;
  relatedEntitySet: string;
  relatedRecordId: string;
};

type QualifyLeadParams = {
  leadId: string;
  createAccount: boolean;
  createContact: boolean;
  createOpportunity: boolean;
  existingAccountId?: string;
};

type CloseOpportunityParams = {
  opportunityId: string;
  outcome: 'won' | 'lost';
  status: number;
  subject: string;
  actualRevenue?: number;
  description?: string;
  closeDate?: string;
};

type DateTimeAttribute = {
  LogicalName: string;
  Format?: string | null;
  DateTimeBehavior?: { Value?: string } | null;
};

type AddNoteParams = {
  regardingEntitySet: string;
  regardingId: string;
  subject?: string;
  text?: string;
  file?: { filename: string; base64: string; mimeType?: string };
};

type CreateTaskParams = {
  subject: string;
  regardingEntitySet?: string;
  regardingId?: string;
  description?: string;
  dueDate?: string;
  priority?: number;
  ownerId?: string;
};

const dynamicsClientInternals = {
  sleep,
  verifiedTlsDispatcher,
  retryDelayMs,
  vendorMessage,
  labelText,
  extractPagingCookie,
};

export { DynamicsCRMClient, DynamicsApiError, makeClient, dynamicsClientInternals };
export type { RecordRef, ListRecordsParams };
