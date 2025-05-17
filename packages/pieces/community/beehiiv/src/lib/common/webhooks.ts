import { Store } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { BEEHIIV_API_URL } from "./constants";

const STORE_KEY_PREFIX = 'beehiiv_webhook_info_for_pub_';

interface StoredWebhookInfo {
    id: string;
    activeEventTypes: string[];
}

async function createNewWebhook(
    publicationId: string,
    webhookUrl: string,
    eventTypesToRegister: string[],
    apiKey: string,
    store: Store
): Promise<void> {
    if (eventTypesToRegister.length === 0) {
        // If there are no events to register, ensure any stored info is cleared
        // as we might have deleted a webhook that had this last event type.
        await store.delete(`${STORE_KEY_PREFIX}${publicationId}`);
        return;
    }

    const response = await httpClient.sendRequest<{ data: { id: string } }>({
        method: HttpMethod.POST,
        url: `${BEEHIIV_API_URL}/publications/${publicationId}/webhooks`,
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: { url: webhookUrl, event_types: eventTypesToRegister },
    });

    if (response.status === 200 && response.body?.data?.id) {
        await store.put<StoredWebhookInfo>(`${STORE_KEY_PREFIX}${publicationId}`, {
            id: response.body.data.id,
            activeEventTypes: [...eventTypesToRegister],
        });
    } else {
        console.error("Beehiiv webhook creation failed:", response.body);
        // Important: If creation fails, ensure we don't leave a misleading stored state
        await store.delete(`${STORE_KEY_PREFIX}${publicationId}`);
        throw new Error(`Failed to create Beehiiv webhook. Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
    }
}

async function deleteWebhookFromApi(
    publicationId: string,
    webhookId: string,
    apiKey: string
): Promise<void> {
    try {
        await httpClient.sendRequest({
            method: HttpMethod.DELETE,
            url: `${BEEHIIV_API_URL}/publications/${publicationId}/webhooks/${webhookId}`,
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
    } catch (error) {
        // Log non-critical errors (e.g., 404 if already deleted)
        // but critical errors (like auth) might still throw and bubble up.
        console.warn(`Attempt to delete Beehiiv webhook ${webhookId} resulted in: ${error}`);
    }
}

export async function subscribeWebhook(
    publicationId: string,
    webhookUrl: string,
    eventTypeToAdd: string,
    apiKey: string,
    store: Store
): Promise<void> {
    const storeKey = `${STORE_KEY_PREFIX}${publicationId}`;
    const storedInfo = await store.get<StoredWebhookInfo>(storeKey);
    let eventTypesForNewWebhook: string[] = [];

    if (storedInfo?.id) {
        await deleteWebhookFromApi(publicationId, storedInfo.id, apiKey);
        // No need to clear store here, createNewWebhook will overwrite or clear if it fails or eventTypesForNewWebhook is empty
        eventTypesForNewWebhook = [...new Set([...storedInfo.activeEventTypes, eventTypeToAdd])];
    } else {
        eventTypesForNewWebhook = [eventTypeToAdd];
    }
    await createNewWebhook(publicationId, webhookUrl, eventTypesForNewWebhook, apiKey, store);
}

export async function unsubscribeWebhook(
    publicationId: string,
    webhookUrl: string, // Needed for potential re-creation
    eventTypeToRemove: string,
    apiKey: string,
    store: Store
): Promise<void> {
    const storeKey = `${STORE_KEY_PREFIX}${publicationId}`;
    const storedInfo = await store.get<StoredWebhookInfo>(storeKey);

    if (storedInfo?.id) {
        await deleteWebhookFromApi(publicationId, storedInfo.id, apiKey);
        // No need to clear store here, createNewWebhook will overwrite or clear if it fails or eventTypesForNewWebhook is empty

        const remainingEventTypes = storedInfo.activeEventTypes.filter(et => et !== eventTypeToRemove);

        // createNewWebhook will handle the case where remainingEventTypes is empty by clearing the store.
        await createNewWebhook(publicationId, webhookUrl, remainingEventTypes, apiKey, store);
    }
    // If no storedInfo, do nothing as the webhook presumably doesn't exist or isn't managed by us.
}
