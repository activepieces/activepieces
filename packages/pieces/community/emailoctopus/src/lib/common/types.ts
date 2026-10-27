import type { AppConnectionType } from '@activepieces/pieces-framework';

export type EmailOctopusAuthValue = {
	type: AppConnectionType.SECRET_TEXT;
	secret_text: string;
};

export type EmailOctopusPage<T> = {
	data: T[];
	paging?: { next?: { url?: string; starting_after?: string } | null };
};

export type EmailOctopusList = {
	id: string;
	name: string;
	created_at: string;
};

export type EmailOctopusListField = {
	tag: string;
	type: 'text' | 'number' | 'date' | 'choice_single' | 'choice_multiple';
	label: string;
	choices?: string[];
	fallback?: string | null;
};

export type EmailOctopusListDetails = EmailOctopusList & {
	fields: EmailOctopusListField[];
	double_opt_in?: boolean;
	tags?: string[];
	counts?: Record<string, number>;
	last_updated_at?: string;
};

export type EmailOctopusTag = { tag: string };

export type EmailOctopusCampaign = {
	id: string;
	name: string;
	status: string;
	created_at: string;
	subject?: string;
	preview_text?: string;
	sent_at?: string | null;
};

export type EmailOctopusCampaignReport = EmailOctopusPage<{
	contact_id?: string;
	contact_email_address?: string;
	occurred_at?: string;
}> & { status?: string };

export type EmailOctopusCampaignLinksReport = {
	data: { url?: string; clicked_total?: number; clicked_unique?: number }[];
};

export type EmailOctopusCampaignSummaryReport = {
	id?: string;
	sent?: number;
	bounced?: Record<string, number>;
	opened?: Record<string, number>;
	clicked?: Record<string, number>;
	complained?: number;
	unsubscribed?: number;
};

export type EmailOctopusContact = {
	id?: string;
	email_address?: string;
	fields?: Record<string, unknown>;
	tags?: string[];
	status?: string;
	created_at?: string;
	last_updated_at?: string;
};

export type EmailOctopusContactUpdate = {
	email_address?: string;
	fields?: Record<string, unknown>;
	status?: string;
	tags?: Record<string, boolean>;
};

export type EmailOctopusContactCreate = {
	email_address: string;
	fields?: Record<string, unknown>;
	status?: string;
	tags?: string[];
};

export type EmailOctopusContactBatchItem = EmailOctopusContactUpdate & {
	id: string;
};

export type EmailOctopusContactBatchResult = {
	success?: { success?: boolean; data?: EmailOctopusContact }[];
	errors?: {
		success?: boolean;
		id?: string;
		type?: string;
		title?: string;
		detail?: string;
	}[];
};

export type EmailOctopusFieldInput = {
	label: string;
	tag: string;
	type: string;
	choices?: string[];
	fallback?: string;
};
