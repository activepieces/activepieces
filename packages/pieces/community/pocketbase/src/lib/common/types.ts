import type { AppConnectionType } from '@activepieces/pieces-framework';

export type PocketbaseAuthValue = {
  type: AppConnectionType.CUSTOM_AUTH;
  props: { host: string; email: string; password: string };
};

export type PocketbaseAuthResponse = { token?: string };

export type PocketbaseRecordPage<T> = { items?: T[]; totalItems: number };

export type PocketbaseCollection = { id: string; name: string; type: string; fields: unknown[] };
