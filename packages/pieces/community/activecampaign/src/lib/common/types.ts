import { CUSTOM_FIELD_TYPE } from './constants';

export type CreateWebhookRequest = {
	name: string;
	url: string;
	events: string[];
	sources: string[];
	listid?: string;
};

export type CreateWebhookResponse = {
	webhook: {
		name: string;
		url: string;
		events: string[];
		sources: string[];
		listid: string;
		cdate: string;
		state: string;
		id: string;
	};
};

export type ContactList = {
	id: string;
	name: string;
};

export type CreateAccountRequest = {
	name: string;
	accountUrl?: string;
	fields?: {
		customFieldId: number;
		fieldValue: any;
	}[];
};

export type CreateContactRequest = {
	email: string;
	firstName?: string;
	lastName?: string;
	phone?: string;
	fieldValues: {
		field: string;
		value: any;
	}[];
};
export type ListAccountsResponse = {
	accounts: {
		name: string;
		id: string;
	}[];
};

export type ListContactsResponse = {
	contacts: {
		email: string;
		firstName: string;
		lastName: string;
		id: string;
	}[];
};

export type ListTagsResponse = {
	tags: {
		tagType: string;
		tag: string;
		id: string;
	}[];
};
export type AccountCustomFieldsResponse = {
	id: string;
	fieldLabel: string;
	fieldType: CUSTOM_FIELD_TYPE;
	fieldOptions?: string[];
	fieldDefaultCurrency?: string;
	fieldDefault?: number | string | string[];
};

export type ContactCustomFieldsResponse = {
	fieldOptions: { field: string; value: string; label: string; id: string }[];
	fields: { id: string; title: string; type: CUSTOM_FIELD_TYPE; options: string[] }[];
};
