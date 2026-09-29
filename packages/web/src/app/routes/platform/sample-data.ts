import { RoleType } from '@activepieces/core-utils';
import {
  ApiKeyResponseWithoutValue,
  AppConnectionScope,
  AppConnectionStatus,
  AppConnectionType,
  AppConnectionWithoutSensitiveData,
  ApplicationEvent,
  ApplicationEventName,
  buildMockEvent,
  EventDestination,
  EventDestinationFormat,
  EventDestinationScope,
  ProjectRole,
  SecretManagerConnectionScope,
  SecretManagerConnectionWithStatus,
  SecretManagerProviderId,
  KeyAlgorithm,
  SeekPage,
  SigningKey,
  Template,
  TemplateStatus,
  TemplateType,
} from '@activepieces/shared';

const SAMPLE_PLATFORM_ID = 'sample-platform';
const SAMPLE_PROJECT_ID = 'sample-project';
const MINUTE_MS = 60 * 1000;

const SAMPLE_EVENT_NAMES: ApplicationEventName[] = [
  ApplicationEventName.FLOW_PUBLISHED,
  ApplicationEventName.CONNECTION_UPSERTED,
  ApplicationEventName.FLOW_UPDATED,
  ApplicationEventName.FLOW_CREATED,
  ApplicationEventName.FLOW_DELETED,
  ApplicationEventName.PROJECT_ROLE_CREATED,
  ApplicationEventName.FLOW_RUN_STARTED,
  ApplicationEventName.SIGNING_KEY_CREATED,
];

function agedTimestamps(minutesAgo: number) {
  const at = new Date(Date.now() - minutesAgo * MINUTE_MS).toISOString();
  return { created: at, updated: at };
}

function toPage<T>(data: T[]): SeekPage<T> {
  return { data, next: null, previous: null };
}

function auditEvents(): ApplicationEvent[] {
  return SAMPLE_EVENT_NAMES.map((event, index) => ({
    ...buildMockEvent({
      event,
      platformId: SAMPLE_PLATFORM_ID,
      projectId: SAMPLE_PROJECT_ID,
    }),
    ...agedTimestamps((index + 1) * 37),
  }));
}

function globalConnections(): AppConnectionWithoutSensitiveData[] {
  return [
    { displayName: 'Slack', pieceName: '@activepieces/piece-slack' },
    {
      displayName: 'Google Sheets',
      pieceName: '@activepieces/piece-google-sheets',
    },
    { displayName: 'Salesforce', pieceName: '@activepieces/piece-salesforce' },
    { displayName: 'HubSpot', pieceName: '@activepieces/piece-hubspot' },
  ].map((entry, index) => ({
    id: `sample-connection-${index}`,
    ...agedTimestamps((index + 2) * 26 * 60),
    externalId: `sample-connection-${index}`,
    displayName: entry.displayName,
    type: AppConnectionType.SECRET_TEXT,
    pieceName: entry.pieceName,
    pieceVersion: '0.0.1',
    projectIds: [],
    platformId: SAMPLE_PLATFORM_ID,
    scope: AppConnectionScope.PLATFORM,
    status:
      index === 3 ? AppConnectionStatus.ERROR : AppConnectionStatus.ACTIVE,
    ownerId: null,
    owner: null,
    metadata: null,
    flowIds: null,
    preSelectForNewProjects: false,
    usingSecretManager: false,
  }));
}

function projectRoles(): ProjectRole[] {
  return [
    { name: 'Release Manager', userCount: 3 },
    { name: 'Support Read Only', userCount: 8 },
    { name: 'Finance Auditor', userCount: 2 },
  ].map((entry, index) => ({
    id: `sample-role-${index}`,
    ...agedTimestamps((index + 1) * 9 * 24 * 60),
    name: entry.name,
    permissions: ['READ_FLOW', 'READ_RUN', 'READ_APP_CONNECTION'],
    platformId: SAMPLE_PLATFORM_ID,
    type: RoleType.CUSTOM,
    userCount: entry.userCount,
  }));
}

function eventDestinations(): EventDestination[] {
  return [
    {
      url: 'https://otlp.datadoghq.com/v1/logs',
      format: EventDestinationFormat.OTLP_PROTOBUF,
    },
    {
      url: 'https://us.i.posthog.com/i/v1/logs',
      format: EventDestinationFormat.OTLP_JSON,
    },
    {
      url: 'https://siem.acme.com/hooks/activepieces',
      format: EventDestinationFormat.RAW,
    },
  ].map(({ url, format }, index) => ({
    id: `sample-destination-${index}`,
    ...agedTimestamps((index + 1) * 5 * 24 * 60),
    platformId: SAMPLE_PLATFORM_ID,
    scope: EventDestinationScope.PLATFORM,
    url,
    events: SAMPLE_EVENT_NAMES.slice(0, 4),
    enabled: true,
    headers: null,
    format,
  }));
}

function secretManagers(): SecretManagerConnectionWithStatus[] {
  return [
    { name: 'Production vault', providerId: SecretManagerProviderId.AWS },
    {
      name: 'Shared secrets',
      providerId: SecretManagerProviderId.HASHICORP,
    },
    { name: 'Legacy store', providerId: SecretManagerProviderId.ONEPASSWORD },
  ].map((entry, index) => ({
    id: `sample-secret-manager-${index}`,
    ...agedTimestamps((index + 1) * 12 * 24 * 60),
    platformId: SAMPLE_PLATFORM_ID,
    providerId: entry.providerId,
    name: entry.name,
    scope: SecretManagerConnectionScope.PLATFORM,
    connection: { configured: true, connected: index !== 2 },
  }));
}

function apiKeys(): ApiKeyResponseWithoutValue[] {
  return [
    { displayName: 'CI deploy key', truncatedValue: 'sk_live_4f2c' },
    { displayName: 'Analytics export', truncatedValue: 'sk_live_9ab1' },
    { displayName: 'Terraform', truncatedValue: 'sk_live_c7d0' },
  ].map((entry, index) => ({
    id: `sample-api-key-${index}`,
    ...agedTimestamps((index + 1) * 21 * 24 * 60),
    platformId: SAMPLE_PLATFORM_ID,
    displayName: entry.displayName,
    truncatedValue: entry.truncatedValue,
    lastUsedAt: new Date(
      Date.now() - (index + 1) * 90 * MINUTE_MS,
    ).toISOString(),
  }));
}

function templates(): Template[] {
  return [
    {
      name: 'New lead to Salesforce',
      summary: 'Push every qualified form submission into Salesforce.',
      pieces: ['@activepieces/piece-forms', '@activepieces/piece-salesforce'],
    },
    {
      name: 'Weekly revenue digest',
      summary: 'Post a Monday summary of closed deals to Slack.',
      pieces: [
        '@activepieces/piece-slack',
        '@activepieces/piece-google-sheets',
      ],
    },
    {
      name: 'Onboard a new hire',
      summary: 'Create accounts and send the welcome pack on day one.',
      pieces: ['@activepieces/piece-gmail', '@activepieces/piece-hubspot'],
    },
  ].map((entry, index) => ({
    id: `sample-template-${index}`,
    ...agedTimestamps((index + 1) * 6 * 24 * 60),
    name: entry.name,
    type: TemplateType.CUSTOM,
    summary: entry.summary,
    description: entry.summary,
    tags: [],
    blogUrl: null,
    metadata: null,
    author: 'Acme Automation Team',
    categories: [],
    pieces: entry.pieces,
    platformId: SAMPLE_PLATFORM_ID,
    status: TemplateStatus.PUBLISHED,
  }));
}

function signingKeys(): SigningKey[] {
  return ['Customer portal', 'Partner dashboard'].map((displayName, index) => ({
    id: `sample-signing-key-${index}`,
    ...agedTimestamps((index + 1) * 30 * 24 * 60),
    platformId: SAMPLE_PLATFORM_ID,
    displayName,
    publicKey: 'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS1zYW1wbGU=',
    algorithm: KeyAlgorithm.RSA,
  }));
}

export const sampleData = {
  signingKeys,
  templatesPage: () => toPage(templates()),
  apiKeysPage: () => toPage(apiKeys()),
  auditEventsPage: () => toPage(auditEvents()),
  globalConnectionsPage: () => toPage(globalConnections()),
  projectRolesPage: () => toPage(projectRoles()),
  eventDestinations,
  secretManagers,
};
