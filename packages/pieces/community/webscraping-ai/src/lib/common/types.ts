import type { AppConnectionType } from '@activepieces/pieces-framework';

export type WebscrapingAiAuthValue = { type: AppConnectionType.SECRET_TEXT; secret_text: string };

export type WebscrapingAiQueryValue = string | number | boolean | null | undefined;

export type WebscrapingAiPageParams = {
	url: string;
	headers?: unknown[];
	timeout?: number;
	js?: boolean;
	jsTimeout?: number;
	waitFor?: string;
	proxy?: string;
	country?: string;
	customProxy?: string;
	jsScript?: string;
	device?: string;
	errorOn404?: boolean;
	errorOnRedirect?: boolean;
};
