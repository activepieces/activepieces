import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const baseUrl = 'https://api.app.sessions.us/api';

export async function getTimezones(): Promise<string[]> {
    const timezones = await httpClient.sendRequest({
        url: 'http://worldtimeapi.org/api/timezone',
        method: HttpMethod.GET,
    });

    return timezones.body as string[]
}

export async function getEvents(auth: string): Promise<any[]> {
    const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/events`,
        headers: {
            "x-api-key": auth,
        }
    });

    return response.body as any[]
}

export function slugify(string: string) {
    // Remove leading and trailing whitespaces
    const trimmedStr = string.trim();

    // Replace spaces with dashes, remove special characters, and convert to lowercase
    const slug = trimmedStr
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')  // Remove non-word characters (alphanumeric, underscores, and dashes)
        .replace(/\s+/g, '-')      // Replace spaces with dashes
        .replace(/-+/g, '-');      // Replace consecutive dashes with a single dash

    return slug;
}

export async function createWebhook(trigger: SessionsUsWebhookTriggers, auth: string, webhookUrl: string, permission: string) {
    const response = await httpClient.sendRequest({
        url: `${baseUrl}/webhooks`,
        method: HttpMethod.POST,
        headers: {
            "x-api-key": auth,
        },
        body: {
            url: webhookUrl,
            trigger: trigger,
            permission: permission,
            linkPublicKey: true,
            integration: 'ACTIVEPIECES'
        }
    })

    return response.body;
}

export async function deleteWebhook(webhookId: string, auth: string) {
    const response = await httpClient.sendRequest({
        url: `${baseUrl}/webhooks/${webhookId}`,
        method: HttpMethod.DELETE,
        headers: {
            "x-api-key": auth,
        }
    })

    return response.body;
}

export enum SessionsUsWebhookTriggers {
    SESSION_CREATED = 'SESSION_CREATED',
    SESSION_STARTED = 'SESSION_STARTED',
    SESSION_ENDED = 'SESSION_ENDED',
    BOOKING_CREATED = 'BOOKING_CREATED',
    BOOKING_STARTED = 'BOOKING_STARTED',
    BOOKING_ENDED = 'BOOKING_ENDED',
    EVENT_CREATED = 'EVENT_CREATED',
    EVENT_STARTED = 'EVENT_STARTED',
    EVENT_ENDED = 'EVENT_ENDED',
    EVENT_PUBLISHED = 'EVENT_PUBLISHED',
    TRANSCRIPT_READY = 'TRANSCRIPT_READY',
    TAKEAWAY_READY = 'TAKEAWAY_READY'
}