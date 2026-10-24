import { HttpMethod } from '@activepieces/pieces-common';

import { zohoInvoiceClient } from './client';

import type {
	ZohoInvoiceAuthValue,
	ZohoInvoiceInvoice,
	ZohoInvoiceListInvoicesResponse,
} from './types';

async function listInvoices({
	auth,
	lastModifiedAt,
}: {
	auth: ZohoInvoiceAuthValue;
	lastModifiedAt?: string;
}): Promise<ZohoInvoiceInvoice[]> {
	const query: { last_modified_at?: string } = {};
	if (lastModifiedAt) query.last_modified_at = lastModifiedAt;
	const response = await zohoInvoiceClient.request<ZohoInvoiceListInvoicesResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/invoices',
		query,
	});
	return response.invoices ?? [];
}

export const zohoInvoiceApi = { listInvoices };
