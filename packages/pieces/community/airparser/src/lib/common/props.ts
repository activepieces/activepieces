import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { airparserClient, isRecord, pathFor, stringOrNull, vendorMessage } from './index';
import { airparserAuth } from '../auth';

export const inboxIdDropdown = Property.Dropdown<string, true, typeof airparserAuth>({
	auth: airparserAuth,
	displayName: 'Inbox',
	required: true,
	refreshers: [],
	options: async ({ auth }) => {
		if (!auth) {
			return { disabled: true, placeholder: 'Please connect your Airparser account.', options: [] };
		}
		try {
			const inboxes = await listInboxes({ apiKey: auth.secret_text });
			return {
				disabled: false,
				options: inboxes.map((inbox) => ({ label: inbox.name ?? inbox.id, value: inbox.id })),
			};
		} catch (error) {
			return { disabled: true, placeholder: errorText(error), options: [] };
		}
	},
});

export const documentIdDropdown = Property.Dropdown<string, true, typeof airparserAuth>({
	auth: airparserAuth,
	displayName: 'Document',
	required: true,
	refreshers: ['inboxId'],
	options: async ({ auth, inboxId }) => {
		if (!auth || typeof inboxId !== 'string' || inboxId === '') {
			return { disabled: true, placeholder: 'Select an inbox first.', options: [] };
		}
		try {
			const options: { label: string; value: string }[] = [];
			for (let page = 1; page <= DOC_DROPDOWN_MAX_PAGES; page++) {
				const response = await airparserClient.call({
					apiKey: auth.secret_text,
					method: HttpMethod.GET,
					path: `/inboxes${pathFor([inboxId])}/docs`,
					operation: 'list documents',
					query: { page, per_page: DOC_DROPDOWN_PAGE_SIZE },
				});
				const docs = isRecord(response) && Array.isArray(response['docs']) ? response['docs'] : [];
				for (const doc of docs) {
					const id = isRecord(doc) ? stringOrNull(doc['_id']) : null;
					if (id !== null && isRecord(doc)) {
						options.push({ label: stringOrNull(doc['name']) ?? id, value: id });
					}
				}
				if (!(isRecord(response) && response['hasNextPage'] === true)) {
					return { disabled: false, options };
				}
			}
			return {
				disabled: false,
				placeholder: `Showing the newest ${options.length} documents. Map a document ID from a previous step for older ones.`,
				options,
			};
		} catch (error) {
			return { disabled: true, placeholder: errorText(error), options: [] };
		}
	},
});

export async function listInboxes({ apiKey }: { apiKey: string }): Promise<{ id: string; name: string | null }[]> {
	const response = await airparserClient.call({
		apiKey,
		method: HttpMethod.GET,
		path: '/inboxes',
		operation: 'list inboxes',
	});
	if (!Array.isArray(response)) {
		throw new Error(`Airparser list inboxes returned an unexpected response: ${vendorMessage(response)}`);
	}
	return response.filter(isRecord).flatMap((inbox) => {
		const id = stringOrNull(inbox['_id']);
		return id === null ? [] : [{ id, name: stringOrNull(inbox['name']) }];
	});
}

function errorText(error: unknown): string {
	return error instanceof Error ? error.message.slice(0, 200) : 'Could not load options from Airparser.';
}

const DOC_DROPDOWN_PAGE_SIZE = 100;
const DOC_DROPDOWN_MAX_PAGES = 5;
