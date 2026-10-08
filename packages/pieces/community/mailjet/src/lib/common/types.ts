import type { AppConnectionType } from '@activepieces/pieces-framework';

export type MailjetAuthValue = {
	type: AppConnectionType.BASIC_AUTH;
	username: string;
	password: string;
};

export type MailjetRecipientResult = {
	Email?: string;
	MessageUUID?: string;
	MessageID?: number;
	MessageHref?: string;
};

export type MailjetMessageResult = {
	Status: string;
	CustomID?: string;
	To?: MailjetRecipientResult[];
	Cc?: MailjetRecipientResult[];
	Bcc?: MailjetRecipientResult[];
	Errors?: unknown[];
};

export type MailjetSendResponse = { Messages: MailjetMessageResult[] };
