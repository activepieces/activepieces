/* eslint-disable @typescript-eslint/no-explicit-any */
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	AppConnectionValueForAuthProperty,
	createTrigger,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { googleDocsAuth, createGoogleClient } from '../auth';
import { documentIdProp, folderIdProp } from '../common/props';
import { flattenDriveFile } from '../common';
import dayjs from 'dayjs';
import { drive_v3, google } from 'googleapis';

type Props = {
	documentId?: string;
	folderId?: string;
};

const polling: Polling<AppConnectionValueForAuthProperty<typeof googleDocsAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const { documentId, folderId } = propsValue;

		const authClient = await createGoogleClient(auth);
		const drive = google.drive({ version: 'v3', auth: authClient });

		if (documentId) {
			const file = await drive.files.get({
				fileId: documentId,
				supportsAllDrives: true,
				fields: '*',
			});
			const modifiedMs = file.data.modifiedTime ? dayjs(file.data.modifiedTime).valueOf() : 0;
			if (lastFetchEpochMS && modifiedMs <= lastFetchEpochMS) return [];
			return [{ epochMilliSeconds: modifiedMs, data: file.data }];
		}

		const q = ["mimeType='application/vnd.google-apps.document'", 'trashed = false'];
		if (lastFetchEpochMS) {
			q.push(`modifiedTime > '${dayjs(lastFetchEpochMS).toISOString()}'`);
		}
		if (folderId) q.push(`'${folderId}' in parents`);

		const items: drive_v3.Schema$File[] = [];
		let nextPageToken: string | undefined;

		do {
			const response: any = await drive.files.list({
				q: q.join(' and '),
				fields: '*',
				orderBy: 'modifiedTime desc',
				supportsAllDrives: true,
				includeItemsFromAllDrives: true,
				pageToken: nextPageToken,
			});

			const fileList: drive_v3.Schema$FileList = response.data;
			if (fileList.files) items.push(...fileList.files);

			if (lastFetchEpochMS === 0) break;
			nextPageToken = response.data.nextPageToken;
		} while (nextPageToken);

		return items
			.filter((item) => item.modifiedTime)
			.map((item) => ({
				epochMilliSeconds: dayjs(item.modifiedTime!).valueOf(),
				data: item,
			}));
	},
};

export const updatedDocumentTrigger = createTrigger({
	auth: googleDocsAuth,
	name: 'updated_document',
	displayName: 'Updated Document',
	description:
		'Triggers when a Google Doc is modified. Select a specific document, restrict to a folder, or leave both empty to watch every document the user can access.',
	type: TriggerStrategy.POLLING,
	props: {
		documentId: documentIdProp(
			'Document (optional)',
			'Watch updates for a specific document. Leave empty to watch all documents.',
			false,
		),
		folderId: folderIdProp(
			'Folder (optional)',
			'Watch only documents inside this folder. Leave empty to watch across Drive.',
		),
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
		const items = await pollingHelper.test(polling, context);
		return items.map((item: any) => flattenDriveFile(item));
	},
	async run(context) {
		const items = await pollingHelper.poll(polling, context);
		return items.map((item: any) => flattenDriveFile(item));
	},
	sampleData: {
		id: '1_9xjsrYFgHVvgqYwAJ8KcsDcNU',
		name: 'Project Brief',
		url: 'https://docs.google.com/document/d/1_9xjsrYFgHVvgqYwAJ8KcsDcNU/edit',
		webViewLink: 'https://docs.google.com/document/d/1_9xjsrYFgHVvgqYwAJ8KcsDcNU/edit?usp=drivesdk',
		mimeType: 'application/vnd.google-apps.document',
		createdTime: '2026-04-22T10:00:00.000Z',
		modifiedTime: '2026-04-22T12:30:00.000Z',
		parents: ['0ABCDEFghijklmnopqrs'],
	},
});
