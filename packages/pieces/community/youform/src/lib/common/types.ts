import type { AppConnectionType } from '@activepieces/pieces-framework';

export type YouformAuthValue = { type: AppConnectionType.SECRET_TEXT; secret_text: string };

export type YouformUser = { id: number; first_name?: string; last_name?: string; email?: string };
export type YouformForm = { id: number; name: string; slug: string };
export type YouformPage<T> = { data: { data: T[] } };
export type YouformCreateWebhookResponse = { data: { id: number } };
