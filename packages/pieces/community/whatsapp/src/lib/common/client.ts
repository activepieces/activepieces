import { randomBytes } from 'crypto';
import {
	AuthenticationType,
	httpClient,
	HttpMethod,
	HttpRequest,
	QueryParams,
} from '@activepieces/pieces-common';
import { WHATSAPP_API_BASE } from './utils';

async function request<T = Record<string, unknown>>({
	accessToken,
	method,
	path,
	body,
	queryParams,
	headers,
}: RequestParams): Promise<T> {
	const httpRequest: HttpRequest = {
		method,
		url: `${WHATSAPP_API_BASE}${path}`,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: accessToken,
		},
		body,
		queryParams,
		headers,
	};
	const response = await httpClient.sendRequest<T>(httpRequest);
	return response.body;
}

async function sendMessage({
	accessToken,
	phoneNumberId,
	to,
	replyToMessageId,
	payload,
}: SendMessageParams): Promise<MessageSendResponse> {
	return request<MessageSendResponse>({
		accessToken,
		method: HttpMethod.POST,
		path: `/${phoneNumberId}/messages`,
		body: {
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to,
			...(replyToMessageId ? { context: { message_id: replyToMessageId } } : {}),
			...payload,
		},
	});
}

function buildMultipartBody({ fields, file }: MultipartParams): { body: Buffer; contentType: string } {
	const boundary = `----ActivepiecesWhatsApp${randomBytes(12).toString('hex')}`;
	const fieldParts = Object.entries(fields).map(([name, value]) =>
		Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}${value}${CRLF}`, 'utf8'),
	);
	const safeFilename = file.filename.replace(/["\r\n]/g, '_');
	const fileHeader = Buffer.from(
		`--${boundary}${CRLF}Content-Disposition: form-data; name="${file.field}"; filename="${safeFilename}"${CRLF}Content-Type: ${file.contentType}${CRLF}${CRLF}`,
		'utf8',
	);
	const closing = Buffer.from(`${CRLF}--${boundary}--${CRLF}`, 'utf8');
	return {
		body: Buffer.concat([...fieldParts, fileHeader, file.data, closing]),
		contentType: `multipart/form-data; boundary=${boundary}`,
	};
}

const CRLF = '\r\n';


function buildInteractiveHeader({
	headerType,
	headerText,
	headerMediaUrl,
}: InteractiveHeaderParams): Record<string, unknown> | undefined {
	if (!headerType || headerType === 'none') return undefined;
	if (headerType === 'text') {
		if (!headerText) {
			throw new Error('Header Text is required when the header type is text.');
		}
		return { type: 'text', text: headerText };
	}
	if (!headerMediaUrl) {
		throw new Error(`Header Media URL is required when the header type is ${headerType}.`);
	}
	return { type: headerType, [headerType]: { link: headerMediaUrl } };
}

function normalizeTemplateComponents(components: unknown): unknown {
	if (typeof components === 'string') {
		return components.replace(/\[\[(\w+)\]\]/g, '{{$1}}');
	}
	if (Array.isArray(components)) {
		return components.map((item) => normalizeTemplateComponents(item));
	}
	if (components && typeof components === 'object') {
		return Object.fromEntries(
			Object.entries(components).map(([key, value]) => [key, normalizeTemplateComponents(value)]),
		);
	}
	return components;
}

export const whatsappClient = {
	buildMultipartBody,
	request,
	sendMessage,
	buildInteractiveHeader,
	normalizeTemplateComponents,
};

export type MessageSendResponse = {
	messaging_product: string;
	contacts: { input: string; wa_id: string }[];
	messages: { id: string; message_status?: string }[];
};

type RequestParams = {
	accessToken: string;
	method: HttpMethod;
	path: string;
	body?: unknown;
	queryParams?: QueryParams;
	headers?: Record<string, string>;
};

type SendMessageParams = {
	accessToken: string;
	phoneNumberId: string;
	to: string;
	replyToMessageId?: string;
	payload: Record<string, unknown>;
};

type InteractiveHeaderParams = {
	headerType?: string;
	headerText?: string;
	headerMediaUrl?: string;
};

type MultipartParams = {
	fields: Record<string, string>;
	file: { field: string; filename: string; contentType: string; data: Buffer };
};
