import type { AppConnectionType } from '@activepieces/pieces-framework';

export type TelnyxAuthValue = {
	type: AppConnectionType.SECRET_TEXT;
	secret_text: string;
};

export type TelnyxResponse<T> = { data?: T };

export type TelnyxMessage = {
	id?: string;
	record_type?: string;
	direction?: string;
	type?: string;
	text?: string;
	messaging_profile_id?: string;
};

export type TelnyxCall = {
	call_control_id?: string;
	call_leg_id?: string;
	call_session_id?: string;
	is_alive?: boolean;
	record_type?: string;
};

export type TelnyxMessagingProfile = { id?: string; name?: string };

export type TelnyxRecord = Record<string, unknown>;

export type TelnyxPage<T = TelnyxRecord> = {
	data?: T[];
	meta?: TelnyxPageMeta;
};

export type TelnyxPageMeta = {
	page_number?: number;
	page_size?: number;
	total_pages?: number;
	total_results?: number;
};
