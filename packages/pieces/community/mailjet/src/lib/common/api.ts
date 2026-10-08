import { HttpMethod } from '@activepieces/pieces-common';

import { mailjetClient } from './client';

import type { MailjetAuthValue, MailjetMessageResult, MailjetSendResponse } from './types';

async function sendEmail({
	auth,
	fromEmail,
	fromName,
	toEmails,
	subject,
	textPart,
	templateId,
	templateVariables,
}: SendEmailParams): Promise<MailjetMessageResult> {
	const message = {
		From: {
			Email: fromEmail,
			Name: fromName || fromEmail,
		},
		To: toEmails.map((to) => ({
			Email: to,
			Name: to,
		})),
		Subject: subject,
		TextPart: textPart,
		TemplateID: templateId,
		TemplateLanguage: !!templateId,
		Variables: templateVariables,
	};
	const response = await mailjetClient.request<MailjetSendResponse>({
		auth,
		method: HttpMethod.POST,
		path: '/v3.1/send',
		body: JSON.stringify({ messages: [message] }),
	});
	return response.Messages[0];
}

export const mailjetApi = { sendEmail };

type SendEmailParams = {
	auth: MailjetAuthValue;
	fromEmail: string;
	fromName?: string;
	toEmails: unknown[];
	subject: string;
	textPart?: string;
	templateId?: number;
	templateVariables?: Record<string, unknown>;
};
