import type { AppConnectionType } from '@activepieces/pieces-framework';

export type ScrapegraphaiAuthValue = { type: AppConnectionType.SECRET_TEXT; secret_text: string };

export type ScrapegraphaiScrapeResult = {
	request_id?: string;
	status?: string;
	website_url?: string;
	user_prompt?: string;
	result?: unknown;
	error?: string;
};

export type ScrapegraphaiMarkdownifyResult = {
	request_id?: string;
	status?: string;
	website_url?: string;
	result?: string;
	error?: string;
};
