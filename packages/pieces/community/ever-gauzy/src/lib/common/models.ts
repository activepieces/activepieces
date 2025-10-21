export enum LanguagesEnum {
	ENGLISH = 'en',
	BULGARIAN = 'bg',
	HEBREW = 'he',
	RUSSIAN = 'ru',
	FRENCH = 'fr',
	SPANISH = 'es',
	CHINESE = 'zh',
	GERMAN = 'de',
	PORTUGUESE = 'pt',
	ITALIAN = 'it',
	DUTCH = 'nl',
	POLISH = 'pl',
	ARABIC = 'ar'
}

export enum TimeLogSourceEnum {
	MOBILE = 'MOBILE',
	WEB_TIMER = 'BROWSER',
	DESKTOP = 'DESKTOP',
	BROWSER_EXTENSION = 'BROWSER_EXTENSION',
	HUBSTAFF = 'HUBSTAFF',
	UPWORK = 'UPWORK',
	TEAMS = 'TEAMS',
	CLOC = 'CLOC'
}

export interface GauzyWebhookInformation {
	webhookId: string;
}

export enum TimeLogType {
	TRACKED = 'TRACKED',
	MANUAL = 'MANUAL',
	IDLE = 'IDLE',
	RESUMED = 'RESUMED'
}