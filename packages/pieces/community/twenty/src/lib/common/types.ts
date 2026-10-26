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

export type TwentyPersonResponse = { data?: { person?: TwentyPerson } };

export type TwentyListResponse = { data?: Record<string, unknown> };

export type TwentyPageInfo = {
	hasNextPage?: boolean;
	hasPreviousPage?: boolean;
	startCursor?: string | null;
	endCursor?: string | null;
};

export type TwentyEnvelope<T> = { data: Record<string, T> };

export type TwentyRecordPage = TwentyEnvelope<TwentyRecord[]> & {
	pageInfo?: TwentyPageInfo;
	totalCount?: number;
};

export type TwentyRecordList = {
	records: TwentyRecord[];
	pageInfo?: TwentyPageInfo;
	totalCount?: number;
};

export type TwentyDuplicateConnection = {
	totalCount?: number;
	pageInfo?: TwentyPageInfo;
	[key: string]: TwentyRecord[] | TwentyPageInfo | number | undefined;
};

export type TwentyMetadataItem = {
	id: string;
	[key: string]: unknown;
};

export type TwentyMetadataPage = {
	data: TwentyMetadataItem[] | Record<string, TwentyMetadataItem[]>;
	pageInfo?: TwentyPageInfo;
	totalCount?: number;
};

export type TwentyMetadataSingle = TwentyMetadataItem & {
	data?: { object?: TwentyMetadataItem };
};
