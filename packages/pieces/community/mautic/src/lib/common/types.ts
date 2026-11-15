import type { AppConnectionType } from '@activepieces/pieces-framework';

export type MauticAuthValue = {
	type: AppConnectionType.CUSTOM_AUTH;
	props: { base_url: string; username: string; password: string };
};

export type MauticEntityFieldType = 'contact' | 'company' | 'lead';

export type MauticFieldOption = { label: string; value: string };

export type MauticField = {
	label: string;
	alias: string;
	type?: string;
	properties: Record<string, MauticFieldOption[]>;
};

export type MauticFieldList = { fields: Record<string, MauticField> };

export type MauticEntityInput = Record<string, unknown>;

export type MauticContact = { id: number; fields?: Record<string, unknown> };

export type MauticCompany = { id: number; fields?: Record<string, unknown> };

export type MauticContactSearchResult = {
	total?: number | string;
	contacts: Record<string, MauticContact>;
};

export type MauticCompanySearchResult = {
	total?: number | string;
	companies: Record<string, MauticCompany>;
};

export type MauticWebhookInformation = {
	hook: {
		isPublished: boolean;
		dateAdded: string;
		dateModified: string;
		createdBy: number;
		createdByUser: string;
		modifiedBy: unknown | null;
		modifiedByUser: string;
		id: number;
		name: string;
		description: string;
		webhookUrl: string;
		secret: string;
		eventsOrderbyDir: string;
		category: {
			id: number;
			createdByUser: string;
			modifiedByUser: string;
			title: string;
			alias: string;
			description: string | null;
			color: string | null;
			bundle: string;
		};
		triggers: string[];
	};
};

export type MauticRecord = Record<string, unknown>;

export type MauticListQuery = {
	search?: string;
	start?: number;
	limit?: number;
	orderBy?: string;
	orderByDir?: string;
	publishedOnly?: boolean;
	where?: unknown[];
};

export type MauticActivityQuery = {
	search?: string;
	includeEvents?: unknown[];
	excludeEvents?: unknown[];
	dateFrom?: string;
	dateTo?: string;
	orderBy?: string;
	orderByDir?: string;
	page?: number;
	limit?: number;
};
