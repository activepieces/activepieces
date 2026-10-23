import type { AppConnectionType } from '@activepieces/pieces-framework';

export type EmailOctopusAuthValue = {
	type: AppConnectionType.SECRET_TEXT;
	secret_text: string;
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
};

export type EmailOctopusListDetails = EmailOctopusList & {
	fields: EmailOctopusListField[];
};

export type EmailOctopusCampaign = {
	id: string;
	name: string;
	status: string;
	created_at: string;
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
	status?: string;
	tags?: Record<string, boolean>;
};
