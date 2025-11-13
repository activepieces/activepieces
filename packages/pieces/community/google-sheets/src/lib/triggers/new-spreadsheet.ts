import { createTrigger,PiecePropValueSchema,TriggerStrategy } from '@activepieces/pieces-framework';
import { googleSheetsAuth } from '../../index';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

import dayjs from 'dayjs';
import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { includeTeamDrivesProp } from '../common/props';
type Props = {
    includeTeamDrives?: boolean;
};
const polling: Polling<PiecePropValueSchema<typeof googleSheetsAuth>, Props> = {
    strategy: DedupeStrategy.TIMEBASED,
    async items({ auth, propsValue, lastFetchEpochMS }) {
        const authValue = auth as PiecePropValueSchema<typeof googleSheetsAuth>;
        const q = ["mimeType='application/vnd.google-apps.spreadsheet'",'trashed = false'];
        if (lastFetchEpochMS) {
            q.push(`createdTime > '${dayjs(lastFetchEpochMS).toISOString()}'`);
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
                includeItemsFromAllDrives: propsValue.includeTeamDrives,
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
export const newSpreadsheetTrigger = createTrigger({
    auth: googleSheetsAuth,
    name: 'new-spreadsheet',
    displayName: 'New Spreadsheet',
    description: 'Triggers when a new spreadsheet is created.',
    type: TriggerStrategy.POLLING,
    props: {
        includeTeamDrives: includeTeamDrivesProp()
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
    sampleData:{
        kind: 'drive#file',
        mimeType: 'application/vnd.google-apps.spreadsheet',
        webViewLink:
            'https://docs.google.com/document/d/1_9xjsrYFgHVvgqYwAJ8KcsDcNU/edit?usp=drivesdk',
        id: '1_9xjsrYFgHVvgqYwAJ8KcsDcN3AzPelsux',
        name: 'Test Document',
    },
});