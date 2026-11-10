import FormData from 'form-data';

import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { tryCatch } from '@activepieces/pieces-framework';

import { mailjetClient } from './client';

import type {
	MailjetAuthValue,
	MailjetDeleteResult,
	MailjetFile,
	MailjetMessageResult,
	MailjetQuery,
	MailjetRecord,
	MailjetSendResponse,
} from './types';

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

async function get({
	auth,
	path,
	query,
}: {
	auth: MailjetAuthValue;
	path: string;
	query?: MailjetQuery;
}): Promise<MailjetRecord> {
	return await mailjetClient.request<MailjetRecord>({
		auth,
		method: HttpMethod.GET,
		path,
		query: toQueryParams({ query }),
	});
}

async function post({ auth, path, body }: BodyParams): Promise<MailjetRecord> {
	return await mailjetClient.request<MailjetRecord>({ auth, method: HttpMethod.POST, path, body });
}

async function put({ auth, path, body }: BodyParams): Promise<MailjetRecord> {
	const { data, error } = await tryCatch(() =>
		mailjetClient.request<MailjetRecord>({ auth, method: HttpMethod.PUT, path, body }),
	);
	if (error instanceof HttpError && error.response.status === 304) {
		return await get({ auth, path });
	}
	if (error) {
		throw error;
	}
	return data;
}

async function remove({
	auth,
	path,
}: {
	auth: MailjetAuthValue;
	path: string;
}): Promise<MailjetDeleteResult> {
	await mailjetClient.request<unknown>({ auth, method: HttpMethod.DELETE, path });
	return { deleted: true };
}

async function uploadContactsCsv({
	auth,
	listId,
	csv,
}: {
	auth: MailjetAuthValue;
	listId: string;
	csv: string;
}): Promise<MailjetRecord> {
	return await mailjetClient.request<MailjetRecord>({
		auth,
		method: HttpMethod.POST,
		path: `/v3/DATA/contactslist/${encodeURIComponent(listId)}/CSVData/text:plain`,
		headers: { 'Content-Type': 'text/plain' },
		body: csv,
	});
}

async function getCsvImportErrors({
	auth,
	jobId,
}: {
	auth: MailjetAuthValue;
	jobId: string;
}): Promise<{ csv: string }> {
	const csv = await mailjetClient.request<string>({
		auth,
		method: HttpMethod.GET,
		path: `/v3/DATA/BatchJob/${encodeURIComponent(jobId)}/CSVError/text:csv`,
	});
	return { csv };
}

async function uploadImage({
	auth,
	file,
	metadata,
}: {
	auth: MailjetAuthValue;
	file: MailjetFile;
	metadata: MailjetRecord;
}): Promise<MailjetRecord> {
	const form = new FormData();
	form.append('Metadata', JSON.stringify(metadata), { contentType: 'application/json' });
	form.append('file', file.data, { filename: file.filename });
	return await mailjetClient.request<MailjetRecord>({
		auth,
		method: HttpMethod.POST,
		path: '/v1/data/images',
		headers: form.getHeaders(),
		body: form,
	});
}

async function replaceImage({
	auth,
	imageId,
	contentType,
	file,
}: {
	auth: MailjetAuthValue;
	imageId: string;
	contentType: string;
	file: MailjetFile;
}): Promise<MailjetRecord> {
	const form = new FormData();
	form.append('file', file.data, { filename: file.filename });
	return await mailjetClient.request<MailjetRecord>({
		auth,
		method: HttpMethod.PUT,
		path: `/v1/data/images/${encodeURIComponent(imageId)}/${encodeURIComponent(contentType)}`,
		headers: form.getHeaders(),
		body: form,
	});
}

function toQueryParams({ query }: { query?: MailjetQuery }): Record<string, string> {
	return Object.fromEntries(
		Object.entries(query ?? {})
			.filter(([, value]) => value !== undefined && value !== '')
			.map(([key, value]) => [key, String(value)]),
	);
}

export const mailjetApi = {
	sendEmail,
	get,
	post,
	put,
	remove,
	uploadContactsCsv,
	getCsvImportErrors,
	uploadImage,
	replaceImage,
};

type BodyParams = { auth: MailjetAuthValue; path: string; body: unknown };

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
