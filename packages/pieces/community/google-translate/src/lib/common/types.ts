export type GoogleTranslateAuthValue = { access_token: string };

export type GoogleTranslateFormat = 'text' | 'html';

export type GoogleTranslateTranslation = {
	translatedText: string;
	detectedSourceLanguage?: string;
	model?: string;
};

export type GoogleTranslateDetection = {
	language: string;
	confidence?: number;
	isReliable?: boolean;
};

export type GoogleTranslateLanguage = {
	language: string;
	name?: string;
};
