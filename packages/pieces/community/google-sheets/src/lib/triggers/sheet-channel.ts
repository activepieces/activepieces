import { isNil, Store, tryCatch } from '@activepieces/pieces-framework';
import { GoogleSheetsAuthValue } from '../common/common';
import { createFileNotification, deleteFileNotification, WebhookInformation } from './helpers';

async function stopChannel({
	auth,
	channel,
	reason,
}: {
	auth: GoogleSheetsAuthValue;
	channel: WebhookInformation | null;
	reason: string;
}): Promise<void> {
	if (isNil(channel) || isNil(channel.id) || isNil(channel.resourceId)) {
		return;
	}
	const channelId = channel.id;
	const resourceId = channel.resourceId;
	const stopped = await tryCatch(() => deleteFileNotification(auth, channelId, resourceId));
	if (stopped.error) {
		console.warn(
			`[google-sheets] could not stop channel ${channelId} ${reason}; it expires on its own and its notifications are ignored.`,
			stopped.error,
		);
	}
}

async function openChannel({
	auth,
	store,
	storeKey,
	spreadsheetId,
	webhookUrl,
	includeTeamDrives,
}: {
	auth: GoogleSheetsAuthValue;
	store: Store;
	storeKey: string;
	spreadsheetId: string;
	webhookUrl: string;
	includeTeamDrives: boolean | undefined;
}): Promise<void> {
	const previous = await store.get<WebhookInformation>(storeKey);
	const created = await createFileNotification(auth, spreadsheetId, webhookUrl, includeTeamDrives);
	const saved = await tryCatch(() => store.put<WebhookInformation>(storeKey, created.data));
	if (saved.error) {
		await stopChannel({ auth, channel: created.data, reason: 'after saving it failed' });
		throw saved.error;
	}
	if (!isNil(previous) && previous.id !== created.data.id) {
		const kept = await tryCatch(() => store.put<WebhookInformation>(previousChannelKey(storeKey), previous));
		if (kept.error) {
			console.warn(
				`[google-sheets] could not remember replaced channel ${previous.id}; its last notifications will be ignored.`,
				kept.error,
			);
		}
		await stopChannel({ auth, channel: previous, reason: 'that it replaced' });
	}
}

async function closeChannel({
	auth,
	store,
	storeKey,
}: {
	auth: GoogleSheetsAuthValue;
	store: Store;
	storeKey: string;
}): Promise<void> {
	const channel = await store.get<WebhookInformation>(storeKey);
	await stopChannel({ auth, channel, reason: 'on disable' });
	await store.delete(storeKey);
	await store.delete(previousChannelKey(storeKey));
}

function previousChannelKey(storeKey: string): string {
	return `${storeKey}_previous`;
}

function isLive(channel: WebhookInformation): boolean {
	if (isNil(channel.expiration) || channel.expiration === '') {
		return true;
	}
	const expiration = Number(channel.expiration);
	return Number.isNaN(expiration) || expiration > Date.now();
}

async function isForeignNotification({
	store,
	storeKey,
	headers,
}: {
	store: Store;
	storeKey: string;
	headers: Record<string, string>;
}): Promise<boolean> {
	const channelId = headers['x-goog-channel-id'];
	if (isNil(channelId) || channelId === '') {
		return false;
	}
	const channel = await store.get<WebhookInformation>(storeKey);
	if (isNil(channel) || isNil(channel.id) || channel.id === channelId) {
		return false;
	}
	const previous = await store.get<WebhookInformation>(previousChannelKey(storeKey));
	return isNil(previous) || previous.id !== channelId || !isLive(previous);
}

export const sheetChannel = {
	openChannel,
	closeChannel,
	isForeignNotification,
};
