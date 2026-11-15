import { HttpMethod } from '@activepieces/pieces-common';

import { googleTranslateClient } from './client';

import type {
	GoogleTranslateAuthValue,
	GoogleTranslateDetection,
	GoogleTranslateFormat,
	GoogleTranslateLanguage,
	GoogleTranslateTranslation,
} from './types';

async function translate({
	auth,
	q,
	target,
	source,
	format,
}: TranslateParams & { auth: GoogleTranslateAuthValue }): Promise<GoogleTranslateTranslation[]> {
	const response = await googleTranslateClient.request<{
		data: { translations: GoogleTranslateTranslation[] };
	}>({
		auth,
		method: HttpMethod.POST,
		path: V2_PATH,
		body: { q, target, ...(source ? { source } : {}), format },
	});
	return response.data.translations;
}

async function detect({
	auth,
	q,
}: {
	auth: GoogleTranslateAuthValue;
	q: string;
}): Promise<GoogleTranslateDetection[]> {
	const response = await googleTranslateClient.request<{
		data: { detections: GoogleTranslateDetection[][] };
	}>({
		auth,
		method: HttpMethod.POST,
		path: `${V2_PATH}/detect`,
		body: { q },
	});
	return response.data.detections.flatMap((candidates) => candidates.slice(0, 1));
}

async function listLanguages({
	auth,
	target,
}: {
	auth: GoogleTranslateAuthValue;
	target: string;
}): Promise<GoogleTranslateLanguage[]> {
	const response = await googleTranslateClient.request<{
		data: { languages: GoogleTranslateLanguage[] };
	}>({
		auth,
		method: HttpMethod.GET,
		path: `${V2_PATH}/languages`,
		query: { target },
	});
	return response.data.languages;
}

export const googleTranslateApi = { translate, detect, listLanguages };

const V2_PATH = '/language/translate/v2';

type TranslateParams = {
	q: string;
	target: string;
	source?: string;
	format: GoogleTranslateFormat;
};
