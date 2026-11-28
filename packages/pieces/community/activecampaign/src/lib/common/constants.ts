export const WEBHOOK_SOURCES = ['public', 'admin', 'api', 'system'];

export enum CUSTOM_FIELD_TYPE {
	TEXT = 'text',
	DROPDOWN = 'dropdown',
	TEXTAREA = 'textarea',
	NUMBER = 'number',
	MONEY = 'currency',
	DATE = 'date',
	DATETIME = 'datetime',
	LIST_BOX = 'listbox',
	MULTISELECT = 'multiselect',
	RADIO = 'radio',
	CHECKBOX = 'checkbox',
	HIDDEN = 'hidden',
}

export const DEAL_STATUS_CODES: Record<string, string> = { open: '0', won: '1', lost: '2' };

export const DEAL_STATUS_LABELS: Record<string, string> = { '0': 'open', '1': 'won', '2': 'lost' };

export const DEAL_OWNER_HINTS = {
	ai: 'This pipeline does not auto-assign owners: set Owner User ID (use List Users).',
	human: 'This pipeline does not auto-assign owners: choose an Owner.',
};

export const CONTACT_LIST_STATUS_LABELS: Record<string, string> = {
	'0': 'unconfirmed',
	'1': 'subscribed',
	'2': 'unsubscribed',
	'3': 'bounced',
};

export const NOTE_RELTYPES = ['Subscriber', 'Deal', 'CustomerAccount'];

export const DEDUPE_WINDOW_MS = 15 * 60 * 1000;

export const DEDUPE_MAX_ENTRIES = 5000;
