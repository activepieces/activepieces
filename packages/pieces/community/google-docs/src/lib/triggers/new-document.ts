import { googleDocsAuth, createGoogleClient } from '../auth';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	AppConnectionValueForAuthProperty,
	createTrigger,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { folderIdProp } from '../common/props';
import { driveQuery } from '../common/drive-query';
import { newDocumentTriggerOutputSchema } from '../output-schemas';
import dayjs from 'dayjs';
import { drive as googleDrive, drive_v3 } from '@googleapis/drive';

const LIST_CALL_TIMEOUT_MS = 10_000;
const LISTING_BUDGET_MS = 25_000;
const TEST_SAMPLE_MAX_PAGES = 10;

type Props = {
	folderId?: string;
};

async function listNewDocuments({
	drive,
	query,
	isTestMode,
}: {
	drive: drive_v3.Drive;
	query: string;
	isTestMode: boolean;
}): Promise<drive_v3.Schema$File[]> {
	const deadline = Date.now() + LISTING_BUDGET_MS;
	const items: drive_v3.Schema$File[] = [];
	let nextPageToken: string | undefined;
	let pages = 0;

	do {
		const remaining = deadline - Date.now();
		if (remaining <= 0) {
			if (isTestMode) {
				break;
			}
			throw new Error(
				'Google Docs New Document: listing new documents ran out of time; the next poll will retry from the same point.',
			);
		}
		const response = await drive.files.list(
			{
				q: query,
				fields: '*',
				orderBy: 'createdTime desc',
				supportsAllDrives: true,
				includeItemsFromAllDrives: true,
				corpora: 'allDrives',
				pageToken: nextPageToken,
			},
			{ timeout: Math.min(LIST_CALL_TIMEOUT_MS, remaining) },
		);
		pages += 1;

		const fileList: drive_v3.Schema$FileList = response.data;
		if (fileList.files) {
			items.push(...fileList.files);
		}
		nextPageToken = fileList.nextPageToken ?? undefined;

		if (isTestMode && (items.length > 0 || pages >= TEST_SAMPLE_MAX_PAGES)) {
			break;
		}
	} while (nextPageToken);

	return items;
}

const polling: Polling<AppConnectionValueForAuthProperty<typeof googleDocsAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const folderId = propsValue.folderId;

		const q = ["mimeType='application/vnd.google-apps.document'", 'trashed = false'];
		if (lastFetchEpochMS) {
			q.push(`createdTime > '${dayjs(lastFetchEpochMS).toISOString()}'`);
		}
		if (folderId) {
			q.push(`'${driveQuery.escapeLiteral(folderId)}' in parents`);
		}

		const authClient = await createGoogleClient(auth);

		const drive = googleDrive({ version: 'v3', auth: authClient });

		const files = await listNewDocuments({
			drive,
			query: q.join(' and '),
			isTestMode: lastFetchEpochMS === 0,
		});

		return files
			.map((item) => ({
				epochMilliSeconds: dayjs(item.createdTime).valueOf(),
				data: item,
			}))
			.sort((a, b) => b.epochMilliSeconds - a.epochMilliSeconds);
	},
};

export const newDocumentTrigger = createTrigger({
	auth: googleDocsAuth,
	name: 'new-document',
	classification: 'READ',
	displayName: 'New Document',
	description: 'Triggers when a new document is created in Drive or a chosen folder.',
	aiMetadata: {
		description:
			'Fires when a new Google Docs document is created, optionally limited to a specific Drive folder. Use to react when a document first appears; it does not fire on edits to existing documents.',
	},
	type: TriggerStrategy.POLLING,
	props: {
		folderId: folderIdProp,
	},
	outputSchema: newDocumentTriggerOutputSchema,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, context);
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, context);
	},
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
	sampleData: {
		kind: 'drive#file',
		mimeType: 'application/vnd.google-apps.document',
		webViewLink:
			'https://docs.google.com/document/d/1_9xjsrYFgHVvgqYwAJ8KcsDcNU/edit?usp=drivesdk',
		id: '1_9xjsrYFgHVvgqYwAJ8KcsDcN3AzPelsux',
		name: 'Test Document',
	},
});
