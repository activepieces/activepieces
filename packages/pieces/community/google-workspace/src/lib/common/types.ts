import type { AppConnectionType } from '@activepieces/pieces-framework';

export type GoogleWorkspaceServiceAccount = {
  clientEmail: string;
  privateKey: string;
  adminEmail: string;
};

export type GoogleWorkspaceAuthValue =
  | { type: AppConnectionType.OAUTH2; access_token: string }
  | { type: AppConnectionType.CUSTOM_AUTH; props: GoogleWorkspaceServiceAccount };

export type GoogleWorkspaceResolvedAuth = { access_token: string };

export type GoogleWorkspaceQuery = Record<string, string | number | boolean | undefined>;

export type GoogleWorkspaceListPage<T> = {
  items: T[];
  nextPageToken?: string;
};

export type GoogleWorkspaceErrorDetail = {
  reason: string;
  message: string;
  domain?: string;
  location?: string;
};

export type GoogleWorkspaceResourceType =
  | 'user'
  | 'group'
  | 'group_member'
  | 'org_unit'
  | 'mobile_device'
  | 'chromeos_device'
  | 'role_assignment';

export type GoogleWorkspaceVerb = 'get' | 'list' | 'create' | 'update' | 'delete';

export type GoogleWorkspaceResourceDefinition = {
  type: GoogleWorkspaceResourceType;
  label: string;
  collectionPath: (parent?: string) => string;
  itemPath: (params: { id: string; parent?: string }) => string;
  itemsKey: string;
  idField: string;
  idHint: string;
  parentLabel?: string;
  verbs: GoogleWorkspaceVerb[];
  supportsQuery: boolean;
  supportsDomain: boolean;
  maxPageSize?: number;
  createExample?: Record<string, unknown>;
  extraListParams?: string[];
  fields?: GoogleWorkspaceRecordField[];
};

export type GoogleWorkspaceRecordField = {
  key: string;
  path: string[];
  displayName: string;
  description?: string;
  kind: 'text' | 'checkbox' | 'dropdown';
  options?: string[];
  requiredOnCreate?: boolean;
};

export type GoogleWorkspaceRecordMode = 'create' | 'update';

export type GoogleWorkspaceCustomSchemaField = {
  fieldName: string;
  displayName?: string;
  fieldType?: string;
  multiValued?: boolean;
};

export type GoogleWorkspaceCustomSchema = {
  schemaName: string;
  displayName?: string;
  fields?: GoogleWorkspaceCustomSchemaField[];
};

export type GoogleWorkspaceActivityQuery = {
  application: string;
  userKey?: string;
  eventName?: string;
  filters?: string;
  startTime?: string;
  maxResults?: number;
};

export type GoogleWorkspaceChannelRequest = {
  id: string;
  address: string;
  token: string;
  expiration: number;
};

export type GoogleWorkspaceChannel = {
  id: string;
  resourceId: string;
  resourceUri?: string;
  token?: string;
  expiration?: string;
};

export type GoogleWorkspaceActivityParameter = {
  name?: string;
  value?: string;
  intValue?: string;
  boolValue?: boolean;
  multiValue?: string[];
  multiIntValue?: string[];
  messageValue?: unknown;
  multiMessageValue?: unknown[];
};

export type GoogleWorkspaceActivity = {
  kind?: string;
  id?: { time?: string; uniqueQualifier?: string; applicationName?: string; customerId?: string };
  actor?: { email?: string; profileId?: string; callerType?: string; key?: string };
  ownerDomain?: string;
  ipAddress?: string;
  events?: { type?: string; name?: string; parameters?: GoogleWorkspaceActivityParameter[] }[];
};

export type GoogleWorkspaceActivityEvent = {
  id: string;
  time: string | null;
  application: string | null;
  eventType: string | null;
  eventName: string | null;
  actor: { email: string | null; profileId: string | null; callerType: string | null };
  ipAddress: string | null;
  ownerDomain: string | null;
  parameters: Record<string, unknown>;
  activity: GoogleWorkspaceActivity;
};

export type GoogleWorkspaceTransferParam = { key: string; value: string[] };

export type GoogleWorkspaceTransferApplication = {
  id: string;
  name: string;
  transferParams?: GoogleWorkspaceTransferParam[];
};

export type GoogleWorkspaceApplicationDataTransfer = {
  applicationId: string;
  applicationTransferParams?: GoogleWorkspaceTransferParam[];
  applicationTransferStatus?: string;
};

export type GoogleWorkspaceDataTransfer = {
  id?: string;
  oldOwnerUserId: string;
  newOwnerUserId: string;
  overallTransferStatusCode?: string;
  requestTime?: string;
  applicationDataTransfers?: GoogleWorkspaceApplicationDataTransfer[];
};
