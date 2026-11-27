import { newOrUpdatedRowTrigger } from '../../src/lib/triggers/new-or-updated-row.trigger';
import { newRowAddedTrigger } from '../../src/lib/triggers/new-row-added-webhook';
import { engineContext, webhookTrigger } from './engine-context';
import { cells, FakeTab, memoryStore } from './fake-google';

export const newRow = webhookTrigger({ trigger: newRowAddedTrigger });
export const changedRow = webhookTrigger({ trigger: newOrUpdatedRowTrigger });
export const CONTENT_CHANGE = { 'x-goog-resource-state': 'update', 'x-goog-changed': 'content' };

export function rowContext({
	store,
	headers = CONTENT_CHANGE,
	triggerColumn = 'all_columns',
	sheetId = 7,
}: {
	store: TestStore;
	headers?: Record<string, string>;
	triggerColumn?: string;
	sheetId?: number;
}): Parameters<typeof newRow.run>[0] {
	return engineContext({
		context: {
			auth: { type: 'OAUTH2', access_token: 'token', props: {}, data: {} },
			propsValue: { spreadsheetId: 'sp1', sheetId, includeTeamDrives: false, trigger_column: triggerColumn },
			store,
			webhookUrl: 'https://example.com/api/v1/webhooks/flow1',
			payload: { headers, body: {}, queryParams: {} },
		},
	});
}

export function tabOf({ rows, title = 'Orders', sheetId = 7 }: { rows: string[][]; title?: string; sheetId?: number }): FakeTab {
	return { sheetId, title, rows: rows.map((values) => cells({ values })) };
}

export type TestStore = ReturnType<typeof memoryStore>['store'];
