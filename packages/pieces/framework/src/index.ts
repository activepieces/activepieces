export * from './lib';

// Foundation symbols re-exported so pieces depend only on framework/common — never
// on core-*/shared directly (enforced by the community-piece import boundary lint).
export { isNil, isEmpty, assertNotNullOrUndefined } from '@activepieces/core-utils';
export type { SeekPage } from '@activepieces/core-utils';
export {
  PieceCategory,
  AppConnectionType,
  MarkdownVariant,
  OAuth2GrantType,
  WebhookHandshakeStrategy,
  ExecutionType,
  AgentToolType,
} from '@activepieces/core-piece-types';
export type { BasicAuthConnectionValue, CustomAuthConnectionValue } from '@activepieces/core-piece-types';