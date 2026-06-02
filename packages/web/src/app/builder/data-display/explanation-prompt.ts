import { FriendlyPieceError, isNil } from '@activepieces/shared';

const MAX_BODY_PAYLOAD_CHARS = 4000;
const MAX_PROPERTY_VALUE_CHARS = 400;
const REDACTED_PLACEHOLDER = '[REDACTED]';

const SECRET_KEY_REGEX =
  /^(authorization|cookie|set-cookie|password|new[_-]?password|current[_-]?password|token|access[_-]?token|refresh[_-]?token|id[_-]?token|api[_-]?key|x[_-]?api[_-]?key|secret|client[_-]?secret|private[_-]?key|bearer|x[_-]?auth)$/i;

const SECRET_PROPERTY_TYPES = new Set([
  'SECRET_TEXT',
  'OAUTH2',
  'BASIC_AUTH',
  'CUSTOM_AUTH',
]);

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  !isNil(value) && typeof value === 'object' && !Array.isArray(value);

const redactSecrets = (value: unknown, depth = 0): unknown => {
  if (depth > 8) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => redactSecrets(entry, depth + 1));
  }
  if (isObjectRecord(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (SECRET_KEY_REGEX.test(key)) {
        result[key] = REDACTED_PLACEHOLDER;
        continue;
      }
      result[key] = redactSecrets(val, depth + 1);
    }
    return result;
  }
  return value;
};

const redactUrlSecrets = (url: string): string => {
  try {
    const parsed = new URL(url);
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (SECRET_KEY_REGEX.test(key)) {
        parsed.searchParams.set(key, REDACTED_PLACEHOLDER);
      }
    }
    return parsed.toString();
  } catch {
    return url;
  }
};

const truncateForPrompt = (
  value: unknown,
  maxChars = MAX_BODY_PAYLOAD_CHARS,
): string => {
  if (isNil(value)) {
    return '';
  }
  const serialized =
    typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  if (serialized.length <= maxChars) {
    return serialized;
  }
  return `${serialized.slice(0, maxChars)}…[truncated]`;
};

const sanitizeStepProperties = (
  properties: StepPropertySnapshot[] | undefined,
): StepPropertySnapshot[] => {
  if (!properties || properties.length === 0) {
    return [];
  }
  return properties.map((prop) => {
    const isSecretType =
      !isNil(prop.type) && SECRET_PROPERTY_TYPES.has(prop.type);
    const isSecretByName = SECRET_KEY_REGEX.test(prop.name);
    const shouldRedactValue = isSecretType || isSecretByName;
    return {
      name: prop.name,
      displayName: prop.displayName,
      description: prop.description,
      type: prop.type,
      required: prop.required,
      currentValue: shouldRedactValue
        ? REDACTED_PLACEHOLDER
        : redactSecrets(prop.currentValue),
      defaultValue: shouldRedactValue
        ? undefined
        : redactSecrets(prop.defaultValue),
    };
  });
};

const formatPropertyLine = (prop: StepPropertySnapshot): string => {
  const fragments: string[] = [];
  fragments.push(`- \`${prop.name}\``);
  if (prop.displayName && prop.displayName !== prop.name) {
    fragments.push(`("${prop.displayName}")`);
  }
  if (prop.type) {
    fragments.push(`type=${prop.type}`);
  }
  if (prop.required) {
    fragments.push('required');
  }
  fragments.push(
    `current=${truncateForPrompt(prop.currentValue, MAX_PROPERTY_VALUE_CHARS)}`,
  );
  if (!isNil(prop.defaultValue)) {
    fragments.push(
      `default=${truncateForPrompt(
        prop.defaultValue,
        MAX_PROPERTY_VALUE_CHARS,
      )}`,
    );
  }
  let line = fragments.join(' ');
  if (prop.description) {
    line += `\n    description: ${prop.description}`;
  }
  return line;
};

const INSTRUCTIONS_BLOCK = [
  'I\'m troubleshooting a failed step in a workflow automation tool. The tool connects to third-party services through integrations called "pieces". Please diagnose what went wrong and give me a concrete fix.',
  '',
  'Diagnostic priority — try in order, pick the first that matches:',
  '',
  '1. **Platform / OAuth app issue (not user-fixable from the step settings).** Applies when ANY of:',
  '   - The API error literally says `invalid_request`, `invalid_scope`, `insufficient_scope`, `insufficient permission`, `invalid_grant`, `invalid_client`, `unauthorized_client`, `access_denied`, or mentions "scope", AND the piece uses OAUTH2.',
  '   - The error is 4xx with an empty / near-empty response body on an OAUTH2 piece from Google/Microsoft/Slack/Discord/Notion/Hubspot/etc. — almost always a missing OAuth scope.',
  '   - The error mentions a specific scope name (e.g. `gmail.labels`, `drive.file`, `calendar.events`).',
  '   In this case, say plainly that this looks like a platform-side OAuth configuration issue, NOT a step setting. Suggest contacting platform support OR (self-hosted) configuring custom OAuth credentials with the required scope.',
  '',
  '2. **Step-level safety toggle.** If 4xx AND there is a Checkbox/Boolean property whose `name` or `displayName` contains "sanitize", "safe", "strict", "restrict", "validate", "verify", or "secure", AND it is currently `true` (or `undefined` with `default=true`) — recommend unchecking it. Reference it by its exact displayName in quotes.',
  '',
  '3. **Unset required property.** Only flag a property as missing when its `required` is literally `true` AND its `current` is explicitly `null` / `undefined` / `""`. Do not infer from absence. Do not invent properties.',
  '',
  '4. **Malformed ID.** If an ID-typed property contains an obvious placeholder or wrong-shaped value, name it.',
  '',
  '5. **Status fallback** (only if 1–4 do not apply): 401 reconnect / 403 user permissions / 404 wrong ID / 429 throttle / 5xx upstream.',
  '',
  'Keep the response short and actionable. Reference specific property displayNames in double quotes when relevant. Do not invent fields that are not in the context below.',
].join('\n');

const buildContextBlock = ({
  error,
  context,
}: BuildExplanationPromptParams): string => {
  const sanitizedError: Record<string, unknown> = {
    message: error.message,
    ...(isNil(error.errorName) ? {} : { errorName: error.errorName }),
    ...(isNil(error.status) ? {} : { httpStatus: error.status }),
    ...(isNil(error.apiMessage) ? {} : { apiMessage: error.apiMessage }),
    ...(isNil(error.requestMethod)
      ? {}
      : { requestMethod: error.requestMethod }),
    ...(isNil(error.requestUrl)
      ? {}
      : { requestUrl: redactUrlSecrets(error.requestUrl) }),
    ...(isNil(error.requestBody)
      ? {}
      : { requestBody: redactSecrets(error.requestBody) }),
    ...(isNil(error.responseBody)
      ? {}
      : { responseBody: redactSecrets(error.responseBody) }),
    ...(isNil(error.responseHeaders)
      ? {}
      : { responseHeaders: redactSecrets(error.responseHeaders) }),
  };

  const lines: string[] = [];
  if (context.pieceDisplayName || context.pieceName) {
    const version = context.pieceVersion ? ` v${context.pieceVersion}` : '';
    lines.push(
      `Piece: ${context.pieceDisplayName ?? context.pieceName}${version}`,
    );
  }
  if (context.pieceAuthType) {
    lines.push(`Piece auth type: ${context.pieceAuthType}`);
  }
  if (context.stepDisplayName || context.stepName) {
    const label = context.stepKind === 'trigger' ? 'Trigger' : 'Action';
    lines.push(`${label}: ${context.stepDisplayName ?? context.stepName}`);
  }
  if (context.stepDescription) {
    lines.push(`Description: ${context.stepDescription}`);
  }

  const sanitizedProperties = sanitizeStepProperties(context.stepProperties);
  if (sanitizedProperties.length > 0) {
    lines.push('');
    lines.push(
      'Step properties (the form fields the user filled in for this step):',
    );
    for (const prop of sanitizedProperties) {
      lines.push(formatPropertyLine(prop));
    }
  }

  lines.push('');
  lines.push('Structured error (secrets redacted):');
  lines.push(truncateForPrompt(sanitizedError));

  return lines.join('\n');
};

const buildExplanationPrompt = (
  params: BuildExplanationPromptParams,
): string => {
  const contextBlock = buildContextBlock(params);
  return `${INSTRUCTIONS_BLOCK}\n\n---\n\n${contextBlock}`;
};

export const explanationPromptUtils = {
  build: buildExplanationPrompt,
};

export type StepPropertySnapshot = {
  name: string;
  displayName?: string;
  description?: string;
  type?: string;
  required?: boolean;
  defaultValue?: unknown;
  currentValue?: unknown;
};

export type ErrorExplanationContext = {
  pieceName?: string;
  pieceVersion?: string;
  pieceDisplayName?: string;
  pieceAuthType?: string;
  stepKind: 'action' | 'trigger';
  stepName?: string;
  stepDisplayName?: string;
  stepDescription?: string;
  stepProperties?: StepPropertySnapshot[];
};

type BuildExplanationPromptParams = {
  error: FriendlyPieceError;
  context: ErrorExplanationContext;
};
