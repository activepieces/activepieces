import type { AppConnectionType } from '@activepieces/pieces-framework';

export type SenderAuthValue = { type: AppConnectionType.SECRET_TEXT; secret_text: string };

export type SenderGroup = { id: string; title: string };
export type SenderSubscriber = { id?: string; email: string };
export type SenderCampaign = { id: string; title?: string; subject?: string };
export type SenderWebhook = { id: string };
export type SenderPage<T> = { data?: T[] };
