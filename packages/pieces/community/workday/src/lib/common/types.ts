import type { AppConnectionType } from '@activepieces/pieces-framework';

export type WorkdayOAuth2AuthValue = {
	type: AppConnectionType.OAUTH2;
	access_token: string;
	props?: Record<string, unknown>;
};

export type WorkdayIsuAuthValue = {
	type: AppConnectionType.CUSTOM_AUTH;
	props: {
		apiHost: string;
		tenant: string;
		username: string;
		password: string;
		wwsVersion?: string;
	};
};

export type WorkdayAuthValue = WorkdayOAuth2AuthValue | WorkdayIsuAuthValue;

export type WorkdayModule = 'recruiting' | 'onboarding' | 'hr_services_time_tracking';

export type WorkdayBusinessObject = {
	label: string;
	value: string;
	path: string;
	service: string;
	wqlDataSource?: string;
};

export type WorkdaySoapObject = {
	label: string;
	value: string;
	service: string;
	operation: string;
	referenceElement: string;
	idType: string;
	recordElement: string;
	referencesInCriteria?: boolean;
	idsRequired?: boolean;
	transactionLog?: boolean;
	responseGroup?: string[];
};

export type WorkdaySoapGetPage = {
	records: WorkdayRecord[];
	totalPages: number;
	asOfEntryDateTime?: string;
};

export type WorkdayRecord = Record<string, unknown>;

export type WorkdayPage<T> = {
	data?: T[];
	total?: number;
};

export type WorkdayReport =
	| { reportPath: string; format: 'json'; rows: WorkdayRecord[] }
	| { reportPath: string; format: 'csv'; csv: string };

export type WorkdaySoapEnvelope<T extends WorkdayRecord> = {
	Envelope?: {
		Body?: T & {
			Fault?: {
				faultstring?: unknown;
				Reason?: unknown;
			};
		};
	};
};

export type WorkdayServerTimestampBody = {
	Server_Timestamp?: {
		Server_Timestamp_Data?: string;
	};
};

export type WorkdaySupplierInvoicesBody = {
	Get_Supplier_Invoices_Response?: {
		Response_Data?: {
			Supplier_Invoice?: WorkdayRecord | WorkdayRecord[];
		};
	};
};
