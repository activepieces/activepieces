import {
	HttpMessageBody,
	HttpMethod,
	HttpRequest,
	QueryParams,
	httpClient,
} from '@activepieces/pieces-common';
import { FilesService, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { Attachment, ParsedMail, simpleParser } from 'mailparser';
import { zohoMailAuth } from './auth';

export type ZohoMailApiCallParams = {
	auth: PiecePropValueSchema<typeof zohoMailAuth>;
	method: HttpMethod;
	resourceUri: string;
	query?: Record<string, string | number | string[] | undefined>;
	body?: any;
};

export async function zohoMailApiCall<T extends HttpMessageBody>({
	auth,
	method,
	resourceUri,
	query,
	body,
}: ZohoMailApiCallParams): Promise<T> {
	const location = auth.props?.['location'] ?? 'zoho.com';
	const baseUrl = `https://mail.${location}/api`;
	const qs: QueryParams = {};

	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value !== null && value !== undefined) {
				qs[key] = String(value);
			}
		}
	}

	const request: HttpRequest = {
		method,
		url: baseUrl + resourceUri,
		headers: {
			Authorization: `Zoho-oauthtoken ${auth.access_token}`,
		},
		queryParams: qs,
		body,
	};

	const response = await httpClient.sendRequest<T>(request);
	return response.body;
}

export async function parseStream(stream: string | Buffer): Promise<ParsedMail> {
	return new Promise<ParsedMail>((resolve, reject) => {
		simpleParser(stream, (err, parsed) => {
			if (err) {
				reject(err);
			} else {
				resolve(parsed);
			}
		});
	});
}

export async function convertAttachment(attachments: Attachment[], files: FilesService) {
	const promises = attachments.map(async (attachment) => {
		try {
			const fileName = attachment.filename ?? `attachment-${Date.now()}`;
			return {
				fileName,
				mimeType: attachment.contentType,
				size: attachment.size,
				data: await files.write({
					fileName: fileName,
					data: attachment.content,
				}),
			};
		} catch (error) {
			console.error(`Failed to process attachment: ${attachment.filename}`, error);
			return null;
		}
	});
	const results = await Promise.all(promises);
	return results.filter((result) => result !== null);
}
