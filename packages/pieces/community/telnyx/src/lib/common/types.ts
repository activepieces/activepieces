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
