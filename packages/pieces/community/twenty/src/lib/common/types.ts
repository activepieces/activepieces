import type { AppConnectionType } from '@activepieces/pieces-framework';

export type TwentyAuthValue = {
	type: AppConnectionType.CUSTOM_AUTH;
	props: { base_url: string; api_key: string };
};

export type TwentyRecord = {
	id?: string;
	createdAt?: string;
	[key: string]: unknown;
};

export type TwentyPersonName = { firstName?: string; lastName?: string };

export type TwentyPerson = TwentyRecord & { name?: TwentyPersonName };

export type TwentyResponse = { data?: Record<string, unknown> };

export type TwentyPersonResponse = TwentyPerson & { data?: TwentyPerson };

export type TwentyListResponse = { data?: Record<string, unknown> };
