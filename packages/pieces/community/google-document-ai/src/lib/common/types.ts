import type { AppConnectionType } from '@activepieces/pieces-framework';

export type GoogleDocumentAiServiceAccountProps = {
	keyFile: string;
	location: string;
	projectId?: string | undefined;
};

export type GoogleDocumentAiAuthValue =
	| { type: AppConnectionType.CUSTOM_AUTH; props: GoogleDocumentAiServiceAccountProps }
	| {
			type: AppConnectionType.OAUTH2;
			access_token: string;
			props?: Record<string, unknown>;
	  };

export type GoogleDocumentAiResolvedAuth = {
	accessToken: string;
	projectId: string;
	location: string;
};

export type GoogleDocumentAiServiceAccountKey = {
	clientEmail: string;
	privateKey: string;
	projectId?: string;
};

export type GoogleDocumentAiServiceAccountKeyFile = {
	type?: unknown;
	client_email?: unknown;
	private_key?: unknown;
	project_id?: unknown;
};

export type GoogleDocumentAiFieldViolation = { field?: string; description?: string };

export type GoogleDocumentAiProcessor = {
	name: string;
	type?: string;
	displayName?: string;
	state?: string;
	defaultProcessorVersion?: string;
	processEndpoint?: string;
	createTime?: string;
};

export type GoogleDocumentAiListProcessorsResponse = {
	processors?: GoogleDocumentAiProcessor[];
	nextPageToken?: string;
};

export type GoogleDocumentAiDocument = {
	text?: string;
	mimeType?: string;
	uri?: string;
	entities?: GoogleDocumentAiEntity[];
	pages?: GoogleDocumentAiPage[];
	error?: { code?: number; message?: string };
	[key: string]: unknown;
};

export type GoogleDocumentAiProcessRequest = {
	rawDocument?: { content: string; mimeType: string; displayName?: string };
	gcsDocument?: { gcsUri: string; mimeType: string };
	fieldMask?: string;
	imagelessMode?: boolean;
	processOptions?: Record<string, unknown>;
	labels?: Record<string, string>;
};

export type GoogleDocumentAiProcessResponse = {
	document?: GoogleDocumentAiDocument;
	humanReviewStatus?: Record<string, unknown>;
};

export type GoogleDocumentAiTextAnchor = {
	textSegments?: { startIndex?: string | number; endIndex?: string | number }[];
	content?: string;
};

export type GoogleDocumentAiLayout = {
	textAnchor?: GoogleDocumentAiTextAnchor;
	confidence?: number;
};

export type GoogleDocumentAiEntity = {
	type?: string;
	mentionText?: string;
	textAnchor?: GoogleDocumentAiTextAnchor;
	confidence?: number;
	normalizedValue?: Record<string, unknown> & { text?: string };
	id?: string;
	pageAnchor?: { pageRefs?: { page?: string | number }[] };
	properties?: GoogleDocumentAiEntity[];
};

export type GoogleDocumentAiPage = {
	pageNumber?: number;
	formFields?: {
		fieldName?: GoogleDocumentAiLayout;
		fieldValue?: GoogleDocumentAiLayout;
		valueType?: string;
	}[];
	tables?: {
		headerRows?: GoogleDocumentAiTableRow[];
		bodyRows?: GoogleDocumentAiTableRow[];
	}[];
	detectedLanguages?: { languageCode?: string; confidence?: number }[];
};

export type GoogleDocumentAiTableRow = { cells?: { layout?: GoogleDocumentAiLayout }[] };

export type GoogleDocumentAiFlatEntity = {
	type: string;
	mentionText: string;
	confidence: number | null;
	normalizedText: string | null;
	normalizedValue: Record<string, unknown> | null;
	id: string | null;
	page: number | null;
	properties: GoogleDocumentAiFlatEntity[];
};

export type GoogleDocumentAiFormField = {
	page: number;
	name: string;
	value: string;
	nameConfidence: number | null;
	valueConfidence: number | null;
	valueType: string | null;
};

export type GoogleDocumentAiTable = { page: number; headerRows: string[][]; bodyRows: string[][] };

export type GoogleDocumentAiDetectedLanguage = { languageCode: string; confidence: number | null };

export type GoogleDocumentAiProcessedDocument = {
	text: string;
	mimeType: string | null;
	pageCount: number;
	languages: GoogleDocumentAiDetectedLanguage[];
	entities: GoogleDocumentAiFlatEntity[];
	formFields: GoogleDocumentAiFormField[];
	tables: GoogleDocumentAiTable[];
	document?: GoogleDocumentAiDocument;
};
