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

export type MailjetRecord = Record<string, unknown>;

export type MailjetQuery = Record<string, string | number | boolean | undefined>;

export type MailjetDeleteResult = { deleted: true };

export type MailjetFile = { filename: string; data: Buffer };
