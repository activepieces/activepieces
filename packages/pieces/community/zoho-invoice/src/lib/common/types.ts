export type ZohoInvoiceAuthValue = {
	access_token: string;
	props?: { region?: string };
};

export type ZohoInvoiceInvoice = {
	invoice_id?: string;
	created_time: string;
};

export type ZohoInvoiceListInvoicesResponse = {
	invoices?: ZohoInvoiceInvoice[];
};
