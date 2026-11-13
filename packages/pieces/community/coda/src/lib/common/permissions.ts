import { HttpMethod } from '@activepieces/pieces-common';
import { CodaPage, codaApi } from './client';

const PERMISSION_PAGE_SIZE = 100;
const MAX_LOOKUP_PAGES = 10;

async function listPermissions({
	token,
	docId,
	limit,
	pageToken,
}: {
	token: string;
	docId: string;
	limit?: number;
	pageToken?: string;
}): Promise<CodaPage<CodaPermission>> {
	return codaApi.request<CodaPage<CodaPermission>>({
		token,
		method: HttpMethod.GET,
		path: `${codaApi.docPath(docId)}/acl/permissions`,
		operation: 'list sharing',
		query: { limit, pageToken },
	});
}

async function findPermission({
	token,
	docId,
	principal,
}: {
	token: string;
	docId: string;
	principal: SharePrincipal;
}): Promise<CodaPermission | undefined> {
	let pageToken: string | undefined = undefined;
	for (let page = 0; page < MAX_LOOKUP_PAGES; page++) {
		const response: CodaPage<CodaPermission> = await listPermissions({ token, docId, limit: PERMISSION_PAGE_SIZE, pageToken });
		const match = (response.items ?? []).find((permission) => samePrincipal({ permission, principal }));
		if (match) {
			return match;
		}
		pageToken = response.nextPageToken;
		if (!pageToken) {
			return undefined;
		}
	}
	return undefined;
}

function samePrincipal({ permission, principal }: { permission: CodaPermission; principal: SharePrincipal }): boolean {
	const actual = permission.principal;
	if (!actual || actual.type !== principal.type) {
		return false;
	}
	if (principal.type === 'email') {
		return (actual.email ?? '').toLowerCase() === principal.email.toLowerCase();
	}
	return (actual.domain ?? '').toLowerCase() === principal.domain.toLowerCase();
}

export const codaPermissions = {
	listPermissions,
	findPermission,
};

export type SharePrincipal = { type: 'email'; email: string } | { type: 'domain'; domain: string };

export type CodaPermission = {
	id: string;
	access?: string;
	principal?: {
		type?: string;
		email?: string;
		domain?: string;
	};
};
