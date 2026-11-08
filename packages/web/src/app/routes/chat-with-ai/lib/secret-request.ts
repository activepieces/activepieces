import {
  AIProviderName,
  apId,
  isNil,
  isObject,
} from '@activepieces/core-utils';
import {
  PieceAuthProperty,
  PieceMetadataModel,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  AIProviderWithoutSensitiveData,
  AppConnectionType,
  UpsertAppConnectionRequestBody,
} from '@activepieces/shared';
import { t } from 'i18next';

import { providerRequestUtils } from '@/app/routes/platform/setup/ai/providers-tab/provider-request';
import { SUPPORTED_AI_PROVIDERS } from '@/features/agents/ai-providers';
import { appConnectionsApi } from '@/features/connections/api/app-connections';
import { aiProviderApi } from '@/features/platform-admin/api/ai-provider-api';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

import { normalizePieceName } from './message-parsers';

function parse(input: unknown): SecretRequest | null {
  if (!isObject(input) || !isTarget(input.target)) return null;
  const fields = Array.isArray(input.fields)
    ? input.fields.flatMap((field) => {
        const parsed = parseField(field);
        return parsed ? [parsed] : [];
      })
    : [];
  const piece = str(input.piece);
  const provider = str(input.provider);
  const name =
    str(input.displayName) ??
    providerName(provider) ??
    pieceLabel(piece) ??
    t('this service');
  return {
    target: input.target,
    piece,
    provider,
    name,
    title: str(input.title) ?? t('{name} key', { name }),
    reason: str(input.reason),
    fields,
  };
}

function savedOutput(output: unknown): SavedSecret | null {
  if (!isObject(output) || output.saved !== true) return null;
  const ref = isObject(output.ref) ? output.ref : null;
  const kind = ref ? str(ref.kind) : null;
  const id = ref ? str(ref.id) : null;
  return {
    label: str(output.label),
    ref: kind && id ? { kind, id } : null,
  };
}

function isExpired(output: unknown): boolean {
  return isObject(output) && output.timedOut === true;
}

function canSaveInline(request: SecretRequest): boolean {
  if (request.fields.length === 0) return false;
  if (request.target === 'ai_provider') {
    return isAiProvider(request.provider);
  }
  return request.target === 'connection' && request.piece !== null;
}

function connectionAuth({
  piece,
  fields,
}: {
  piece: Pick<PieceMetadataModel, 'auth'> | undefined;
  fields: SecretField[];
}): PieceAuthProperty | null {
  if (!piece?.auth) return null;
  const options = Array.isArray(piece.auth) ? piece.auth : [piece.auth];
  return (
    options.find(
      (auth) =>
        INLINE_AUTH_TYPES.includes(auth.type) &&
        fieldsMatchAuth({ auth, fields }),
    ) ?? null
  );
}

function existingProviderKey({
  request,
  configs,
}: {
  request: SecretRequest;
  configs: ExistingProviderKey[] | undefined;
}): ExistingProviderKey | null {
  if (request.target !== 'ai_provider' || isNil(configs)) return null;
  const sameProvider = configs.filter(
    (config) => config.provider === request.provider,
  );
  return (
    sameProvider.find((config) => config.name === keyDisplayName(request)) ??
    sameProvider[0] ??
    null
  );
}

function failureOf(error: unknown): SaveFailure {
  return api.isError(error) &&
    (error.response?.status === 403 || error.response?.status === 401)
    ? 'forbidden'
    : 'invalid';
}

async function save({
  request,
  values,
  piece,
  replace,
}: {
  request: SecretRequest;
  values: Record<string, string>;
  piece: PieceMetadataModel | undefined;
  replace: ExistingProviderKey | null;
}): Promise<SecretRef> {
  if (request.target === 'ai_provider') {
    const provider = request.provider;
    if (!isAiProvider(provider)) throw new Error('Unsupported provider');
    const body = providerRequestUtils.buildCreateRequest({
      provider,
      displayName: replace?.name ?? keyDisplayName(request),
      credentials: values,
      headers: {},
      existingConfig: replace?.config,
    });
    if (!isNil(replace)) {
      await aiProviderApi.update(replace.id, {
        displayName: body.displayName,
        config: body.config,
        auth: body.auth,
      });
      return { kind: 'ai_provider', id: replace.id };
    }
    const created = await aiProviderApi.upsert(body);
    return { kind: 'ai_provider', id: created.id };
  }
  const auth = connectionAuth({ piece, fields: request.fields });
  const projectId = authenticationSession.getProjectId();
  if (!piece || !auth || !projectId) {
    throw new Error('Unsupported connection');
  }
  const connection = await appConnectionsApi.upsert(
    connectionRequest({ piece, auth, projectId, values }),
  );
  return { kind: 'connection', id: connection.id };
}

function connectionRequest({
  piece,
  auth,
  projectId,
  values,
}: {
  piece: Pick<PieceMetadataModel, 'name' | 'displayName' | 'version'>;
  auth: PieceAuthProperty;
  projectId: string;
  values: Record<string, string>;
}): UpsertAppConnectionRequestBody {
  const common = {
    externalId: apId(),
    displayName: piece.displayName,
    pieceName: piece.name,
    projectId,
    pieceVersion: piece.version,
  };
  const first = Object.values(values)[0] ?? '';
  switch (auth.type) {
    case PropertyType.SECRET_TEXT:
      return {
        ...common,
        type: AppConnectionType.SECRET_TEXT,
        value: { type: AppConnectionType.SECRET_TEXT, secret_text: first },
      };
    case PropertyType.BASIC_AUTH:
      return {
        ...common,
        type: AppConnectionType.BASIC_AUTH,
        value: {
          type: AppConnectionType.BASIC_AUTH,
          username: values.username ?? '',
          password: values.password ?? '',
        },
      };
    default:
      return {
        ...common,
        type: AppConnectionType.CUSTOM_AUTH,
        value: { type: AppConnectionType.CUSTOM_AUTH, props: { ...values } },
      };
  }
}

function settingsPath(request: SecretRequest): string {
  if (request.target === 'ai_provider') return '/platform/ai';
  if (request.target === 'secret_manager') return '/platform/secret-managers';
  return authenticationSession.appendProjectRoutePrefix('/connections');
}

function fieldsMatchAuth({
  auth,
  fields,
}: {
  auth: PieceAuthProperty;
  fields: SecretField[];
}): boolean {
  const names = fields.map((field) => field.name);
  switch (auth.type) {
    case PropertyType.SECRET_TEXT:
      return names.length === 1;
    case PropertyType.BASIC_AUTH:
      return (
        names.length === 2 &&
        names.includes('username') &&
        names.includes('password')
      );
    case PropertyType.CUSTOM_AUTH: {
      const props: Record<string, { type: PropertyType; required: boolean }> =
        auth.props;
      const known = names.every((name) =>
        TEXT_PROP_TYPES.includes(props[name]?.type),
      );
      const required = Object.entries(props)
        .filter(([, prop]) => prop.required)
        .every(([name]) => names.includes(name));
      return known && required;
    }
    default:
      return false;
  }
}

function keyDisplayName(request: SecretRequest): string {
  return t('{name} key', { name: request.name });
}

function parseField(value: unknown): SecretField | null {
  if (!isObject(value)) return null;
  const name = str(value.name);
  if (!name) return null;
  return {
    name,
    label: str(value.label) ?? name,
    type: value.type === 'text' ? 'text' : 'password',
    hint: str(value.hint),
  };
}

function providerName(provider: string | null): string | null {
  if (!provider) return null;
  return (
    SUPPORTED_AI_PROVIDERS.find((info) => info.provider === provider)?.name ??
    null
  );
}

function pieceLabel(piece: string | null): string | null {
  if (!piece) return null;
  const short = normalizePieceName(piece).replace('@activepieces/piece-', '');
  return short
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function isAiProvider(value: string | null): value is AIProviderName {
  return (
    value !== null &&
    value !== AIProviderName.ACTIVEPIECES &&
    Object.values(AIProviderName).some((name) => name === value)
  );
}

function isTarget(value: unknown): value is SecretTarget {
  return (
    value === 'connection' ||
    value === 'ai_provider' ||
    value === 'secret_manager'
  );
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

const TEXT_PROP_TYPES: (PropertyType | undefined)[] = [
  PropertyType.SHORT_TEXT,
  PropertyType.LONG_TEXT,
  PropertyType.SECRET_TEXT,
];

const INLINE_AUTH_TYPES: PropertyType[] = [
  PropertyType.SECRET_TEXT,
  PropertyType.BASIC_AUTH,
  PropertyType.CUSTOM_AUTH,
];

export const secretRequestUtils = {
  parse,
  savedOutput,
  isExpired,
  canSaveInline,
  connectionAuth,
  connectionRequest,
  existingProviderKey,
  failureOf,
  save,
  settingsPath,
};

export type SecretTarget = 'connection' | 'ai_provider' | 'secret_manager';

export type SecretField = {
  name: string;
  label: string;
  type: 'password' | 'text';
  hint: string | null;
};

export type SecretRequest = {
  target: SecretTarget;
  piece: string | null;
  provider: string | null;
  name: string;
  title: string;
  reason: string | null;
  fields: SecretField[];
};

export type SecretRef = { kind: string; id: string };

export type SaveFailure = 'forbidden' | 'invalid';

export type ExistingProviderKey = Pick<
  AIProviderWithoutSensitiveData,
  'id' | 'name' | 'provider' | 'config'
>;

type SavedSecret = { label: string | null; ref: SecretRef | null };
