import { googleDocsAuth } from '../../index';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	createTrigger,
	PiecePropValueSchema,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { folderIdProp } from '../common/props';
import dayjs from 'dayjs';
import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

type Props = {
	folderId?: string;
};

const polling: Polling<PiecePropValueSchema<typeof googleDocsAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const authValue = auth as PiecePropValueSchema<typeof googleDocsAuth>;
		const folderId = propsValue.folderId;

		const q = ["mimeType='application/vnd.google-apps.document'", 'trashed = false'];
		if (lastFetchEpochMS) {
			q.push(`createdTime > '${dayjs(lastFetchEpochMS).toISOString()}'`);
		}
		if (folderId) {
			q.push(`'${folderId}' in parents`);
		}

		const authClient = new OAuth2Client();
		authClient.setCredentials(authValue);

		const drive = google.drive({ version: 'v3', auth: authClient });

		let nextPageToken;
		const items = [];

		do {
			const response: any = await drive.files.list({
				q: q.join(' and '),
				fields: '*',
				orderBy: 'createdTime desc',
				supportsAllDrives: true,
				includeItemsFromAllDrives: true,
				pageToken: nextPageToken,
			});

			const fileList: drive_v3.Schema$FileList = response.data;

			if (fileList.files) {
				items.push(...fileList.files);
			}

			if (lastFetchEpochMS === 0) break;

			nextPageToken = response.data.nextPageToken;
		} while (nextPageToken);

		return items.map((item) => ({
			epochMilliSeconds: dayjs(item.createdTime).valueOf(),
			data: item,
		}));
	},
};

export const newDocumentTrigger = createTrigger({
	auth: googleDocsAuth,
	name: 'new-document',
	displayName: 'New Document',
	description: 'Triggers when a new document is added to a specific folder(optional).',
	type: TriggerStrategy.POLLING,
	props: {
		folderId: folderIdProp,
	},
	async onEnable(context) {
		await pollingHelper.onEnable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
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
