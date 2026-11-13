import {
	AppConnectionValueForAuthProperty,
	createTrigger,
	isNil,
	Store,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import * as z from 'zod/mini';
import { drive as googleDrive } from '@googleapis/drive';
import { createGoogleClient, googleSheetsAuth, GoogleSheetsAuthValue } from '../common/common';
import { driveListing, DriveFileListing } from '../common/drive-listing';
import { includeTeamDrivesProp } from '../common/props';
import { newSpreadsheetTriggerOutputSchema } from '../output-schemas';

const LAST_POLL_KEY = 'lastPoll';
const HELD_WINDOW_KEY = 'heldWindow';
const MAX_HELD_IDS = 5000;

const heldWindowSchema = z.object({
	incompleteDrives: z.array(z.string()),
	emittedIds: z.array(z.string()),
});

const polling: Polling<AppConnectionValueForAuthProperty<typeof googleSheetsAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const listing = await listSpreadsheets({
			auth,
			includeTeamDrives: propsValue.includeTeamDrives,
			since: lastFetchEpochMS,
		});
		return listing.files.map((item) => ({
			epochMilliSeconds: dayjs(item.createdTime).valueOf(),
			data: item,
		}));
	},
};

export const newSpreadsheetTrigger = createTrigger({
	auth: googleSheetsAuth,
	name: 'new-spreadsheet',
	classification: 'READ',
	displayName: 'New Spreadsheet',
	description: 'Triggers when a new spreadsheet is created.',
	aiMetadata: {
		description:
			'Fires when a new Google Sheets spreadsheet is created in the connected Drive (optionally including shared drives), emitting one event per new spreadsheet with its Drive file metadata. Polls periodically rather than in real time.',
	},
	type: TriggerStrategy.POLLING,
	props: {
		includeTeamDrives: includeTeamDrivesProp({ advanced: false }),
	},
	outputSchema: newSpreadsheetTriggerOutputSchema,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, context);
		if (!context.isRepublish) {
			await context.store.delete(HELD_WINDOW_KEY);
		}
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, context);
	},
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async run(context) {
		return await pollHeldWindow({
			store: context.store,
			auth: context.auth,
			includeTeamDrives: context.propsValue.includeTeamDrives,
		});
	},
	sampleData: {
		kind: 'drive#file',
		mimeType: 'application/vnd.google-apps.spreadsheet',
		webViewLink: 'https://docs.google.com/document/d/1_9xjsrYFgHVvgqYwAJ8KcsDcNU/edit?usp=drivesdk',
		id: '1_9xjsrYFgHVvgqYwAJ8KcsDcN3AzPelsux',
		name: 'Test Document',
	},
});

async function listSpreadsheets({
	auth,
	includeTeamDrives,
	since,
}: {
	auth: GoogleSheetsAuthValue;
	includeTeamDrives: boolean | undefined;
	since: number;
}): Promise<DriveFileListing> {
	const q = ["mimeType='application/vnd.google-apps.spreadsheet'", 'trashed = false'];
	if (since) {
		q.push(`createdTime > '${dayjs(since).toISOString()}'`);
	}
	const authClient = await createGoogleClient(auth);
	const drive = googleDrive({ version: 'v3', auth: authClient });
	return driveListing.listFilesAcrossCorpora({
		drive,
		params: {
			q: q.join(' and '),
			fields: '*',
			orderBy: 'createdTime desc',
			supportsAllDrives: true,
			includeItemsFromAllDrives: includeTeamDrives,
			corpora: includeTeamDrives ? 'allDrives' : 'user',
		},
		maxPages: since === 0 ? 1 : undefined,
	});
}

async function pollHeldWindow({
	store,
	auth,
	includeTeamDrives,
}: {
	store: Store;
	auth: GoogleSheetsAuthValue;
	includeTeamDrives: boolean | undefined;
}): Promise<unknown[]> {
	const lastPoll = await store.get<number>(LAST_POLL_KEY);
	if (isNil(lastPoll)) {
		throw new Error("lastPoll doesn't exist in the store.");
	}
	const held = heldWindowSchema.safeParse(await store.get<unknown>(HELD_WINDOW_KEY));
	const alreadyEmitted = new Set(held.success ? held.data.emittedIds : []);

	const listing = await listSpreadsheets({ auth, includeTeamDrives, since: lastPoll });
	const listed = listing.files.map((file) => ({ file, epoch: dayjs(file.createdTime).valueOf() }));
	const fresh = listed.filter(
		({ file, epoch }) => epoch > lastPoll && (isNil(file.id) || !alreadyEmitted.has(file.id)),
	);
	const newestEpoch = listed.reduce((newest, { epoch }) => (epoch > newest ? epoch : newest), lastPoll);

	if (listing.incompleteDrives.length === 0) {
		await store.delete(HELD_WINDOW_KEY);
		await store.put(LAST_POLL_KEY, newestEpoch);
		return fresh.map(({ file }) => file);
	}

	const emittedIds = [
		...alreadyEmitted,
		...fresh.map(({ file }) => file.id).filter((id): id is string => !isNil(id)),
	];
	if (emittedIds.length > MAX_HELD_IDS) {
		console.warn(
			`[google-sheets] new_spreadsheet: shared drives ${listing.incompleteDrives.join(', ')} could not be searched for too long; moving on, spreadsheets created there meanwhile may not fire.`,
		);
		await store.delete(HELD_WINDOW_KEY);
		await store.put(LAST_POLL_KEY, newestEpoch);
		return fresh.map(({ file }) => file);
	}
	console.warn(
		`[google-sheets] new_spreadsheet: Google Drive could not search shared drives ${listing.incompleteDrives.join(', ')}; other drives were checked and these will be retried on the next check.`,
	);
	await store.put(HELD_WINDOW_KEY, { incompleteDrives: listing.incompleteDrives, emittedIds });
	return fresh.map(({ file }) => file);
}

type Props = {
	includeTeamDrives?: boolean;
};
