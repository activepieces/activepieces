import type { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

import type { facebookLeadsAuth } from '../auth';

export type FacebookLeadsAuthValue = AppConnectionValueForAuthProperty<typeof facebookLeadsAuth>;

export type FacebookLeadsPaginatedResponse<T> = {
	data: T[];
	paging?: {
		next?: string;
	};
};

export type FacebookLeadsWebhookPayload = {
	entry: {
		changes: {
			value: {
				form_id: string;
				leadgen_id: string;
			};
		}[];
	}[];
};

export type FacebookLeadsPage = {
	id: string;
	name: string;
	category: string;
	category_list: string[];
	access_token: string;
	tasks: string[];
};

export type FacebookLeadsPageDropdown = {
	id: string;
	accessToken: string;
};

export type FacebookLeadsForm = {
	id: string;
	locale: string;
	name: string;
	status: string;
};

export type FacebookLeadsLead = {
	field_data: Array<{ name: string; values: unknown[] }>;
	created_time: string;
	ad_id: string;
	ad_name: string;
	adset_id: string;
	adset_name: string;
	campaign_id: string;
	campaign_name: string;
	form_id: string;
	platform: string;
	id: string;
};
