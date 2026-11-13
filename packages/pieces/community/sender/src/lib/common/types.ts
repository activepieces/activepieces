import type { AppConnectionType } from '@activepieces/pieces-framework';

export type SenderAuthValue = { type: AppConnectionType.SECRET_TEXT; secret_text: string };

export type SenderGroup = { id: string; title: string };
export type SenderSubscriber = {
	id?: string;
	email: string;
	firstname?: string | null;
	lastname?: string | null;
};
export type SenderCampaign = { id: string; title?: string; subject?: string };
export type SenderWebhook = { id: string };
export type SenderUser = {
	id: string;
	email?: string;
	username?: string;
	name?: string;
	surname?: string;
};
export type SenderRecord = Record<string, unknown>;
export type SenderPage<T> = {
	data?: T[];
	links?: Record<string, string | null>;
	meta?: SenderRecord;
	has_more_resources?: boolean;
};
export type SenderCampaignReport =
	| 'opens'
	| 'clicks'
	| 'unsubscribes'
	| 'hard_bounces'
	| 'soft_bounces'
	| 'complaints'
	| 'emails-sent';
export type SenderTransactionalReport = 'sent' | 'opens' | 'clicks' | 'bounces' | 'complaints';
