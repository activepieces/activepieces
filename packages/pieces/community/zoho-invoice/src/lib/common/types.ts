export type ZohoInvoiceAuthValue = {
	access_token: string;
	props?: { region?: string };
};

export type ZohoInvoiceOrgScope = {
	organizationId: string;
};

export type ZohoInvoiceResponse = {
	code?: number;
	message?: string;
	[key: string]: unknown;
};

export type ZohoInvoiceUserResponse = ZohoInvoiceResponse & {
	user?: { user_id?: string; name?: string; email?: string; user_role?: string };
};

export type ZohoInvoiceInvoice = {
	invoice_id?: string;
	created_time: string;
};

export type ZohoInvoiceListInvoicesResponse = {
	invoices?: ZohoInvoiceInvoice[];
};
