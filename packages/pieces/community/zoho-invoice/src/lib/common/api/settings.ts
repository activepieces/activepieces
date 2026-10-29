import { HttpMethod } from '@activepieces/pieces-common';

import { zohoInvoiceClient } from '../client';
import { zohoInvoiceUtils } from '../utils';

import type { ZohoInvoiceAuthValue, ZohoInvoiceOrgScope, ZohoInvoiceResponse } from '../types';

async function createCurrency({
	auth,
	organizationId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: '/settings/currencies',
		body,
	});
}

async function listCurrencies({
	auth,
	organizationId,
	filterBy,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	filterBy?: string;
	page?: number;
	perPage?: number;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: '/settings/currencies',
		query: zohoInvoiceUtils.toQuery({
			filter_by: filterBy,
			page,
			per_page: perPage,
		}),
	});
}

async function getCurrency({
	auth,
	organizationId,
	currencyId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	currencyId: string;
}): Promise<ZohoInvoiceCurrencyResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceCurrencyResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/settings/currencies/${currencyId}`,
	});
}

async function updateCurrency({
	auth,
	organizationId,
	currencyId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	currencyId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/settings/currencies/${currencyId}`,
		body,
	});
}

async function deleteCurrency({
	auth,
	organizationId,
	currencyId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	currencyId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/settings/currencies/${currencyId}`,
	});
}

async function createExchangeRate({
	auth,
	organizationId,
	currencyId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	currencyId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/settings/currencies/${currencyId}/exchangerates`,
		body,
	});
}

async function listExchangeRates({
	auth,
	organizationId,
	currencyId,
	fromDate,
	isCurrentDate,
	sortColumn,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	currencyId: string;
	fromDate?: string;
	isCurrentDate?: boolean;
	sortColumn?: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/settings/currencies/${currencyId}/exchangerates`,
		query: zohoInvoiceUtils.toQuery({
			from_date: fromDate,
			is_current_date: isCurrentDate,
			sort_column: sortColumn,
		}),
	});
}

async function getExchangeRate({
	auth,
	organizationId,
	currencyId,
	exchangeRateId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	currencyId: string;
	exchangeRateId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/settings/currencies/${currencyId}/exchangerates/${exchangeRateId}`,
	});
}

async function updateExchangeRate({
	auth,
	organizationId,
	currencyId,
	exchangeRateId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	currencyId: string;
	exchangeRateId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/settings/currencies/${currencyId}/exchangerates/${exchangeRateId}`,
		body,
	});
}

async function deleteExchangeRate({
	auth,
	organizationId,
	currencyId,
	exchangeRateId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	currencyId: string;
	exchangeRateId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/settings/currencies/${currencyId}/exchangerates/${exchangeRateId}`,
	});
}

async function createTax({
	auth,
	organizationId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: '/settings/taxes',
		body,
	});
}

async function listTaxes({
	auth,
	organizationId,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	page?: number;
	perPage?: number;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: '/settings/taxes',
		query: zohoInvoiceUtils.toQuery({ page, per_page: perPage }),
	});
}

async function getTax({
	auth,
	organizationId,
	taxId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	taxId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/settings/taxes/${taxId}`,
	});
}

async function updateTax({
	auth,
	organizationId,
	taxId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	taxId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/settings/taxes/${taxId}`,
		body,
	});
}

async function deleteTax({
	auth,
	organizationId,
	taxId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	taxId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/settings/taxes/${taxId}`,
	});
}

async function createTaxGroup({
	auth,
	organizationId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: '/settings/taxgroups',
		body,
	});
}

async function getTaxGroup({
	auth,
	organizationId,
	taxGroupId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	taxGroupId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/settings/taxgroups/${taxGroupId}`,
	});
}

async function updateTaxGroup({
	auth,
	organizationId,
	taxGroupId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	taxGroupId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/settings/taxgroups/${taxGroupId}`,
		body,
	});
}

async function deleteTaxGroup({
	auth,
	organizationId,
	taxGroupId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	taxGroupId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/settings/taxgroups/${taxGroupId}`,
	});
}

export const settingsApi = {
	createCurrency,
	listCurrencies,
	getCurrency,
	updateCurrency,
	deleteCurrency,
	createExchangeRate,
	listExchangeRates,
	getExchangeRate,
	updateExchangeRate,
	deleteExchangeRate,
	createTax,
	listTaxes,
	getTax,
	updateTax,
	deleteTax,
	createTaxGroup,
	getTaxGroup,
	updateTaxGroup,
	deleteTaxGroup,
};

export type ZohoInvoiceCurrencyResponse = ZohoInvoiceResponse & {
	currency?: {
		currency_code?: string;
		currency_symbol?: string;
		price_precision?: number;
		currency_format?: string;
	};
};
