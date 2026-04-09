import { z } from 'zod';
import { ConnectionKeyType } from './connection-key';

export const GetOrDeleteConnectionFromTokenRequest = z.object({
  projectId: z.string(),
  token: z.string(),
  appName: z.string(),
});

export type GetOrDeleteConnectionFromTokenRequest = z.infer<
  typeof GetOrDeleteConnectionFromTokenRequest
>;

export const ListConnectionKeysRequest = z.object({
  limit: z.coerce.number().optional(),
  cursor: z.string().optional(),
  projectId: z.string(),
});

export type ListConnectionKeysRequest = z.infer<
  typeof ListConnectionKeysRequest
>;

export const UpsertApiKeyConnectionFromToken = z.object({
  appCredentialId: z.string(),
  apiKey: z.string(),
  token: z.string(),
});

export type UpsertApiKeyConnectionFromToken = z.infer<
  typeof UpsertApiKeyConnectionFromToken
>;

export const UpsertOAuth2ConnectionFromToken = z.object({
  appCredentialId: z.string(),
  props: z.record(z.string(), z.unknown()),
  token: z.string(),
  code: z.string(),
  redirectUrl: z.string(),
});

export type UpsertOAuth2ConnectionFromToken = z.infer<
  typeof UpsertOAuth2ConnectionFromToken
>;

export const UpsertConnectionFromToken = z.union([
  UpsertApiKeyConnectionFromToken,
  UpsertOAuth2ConnectionFromToken,
]);

export type UpsertConnectionFromToken = z.infer<
  typeof UpsertConnectionFromToken
>;

export const UpsertSigningKeyConnection = z.object({
  projectId: z.string(),
  settings: z.object({
    type: z.literal(ConnectionKeyType.SIGNING_KEY),
  }),
});

export type UpsertSigningKeyConnection = z.infer<
  typeof UpsertSigningKeyConnection
>;
