import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  createTrigger,
  Property,
  Trigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { sessionAuth } from '../..';

export const baseUrl = 'https://api.app.sessions.us/api';

export const properties = {
  permission: Property.StaticDropdown({
    displayName: 'Permission',
    description:
      'Personal applies for the user only, organization applies to every event that is made by a user of the organization.',
    required: true,
    defaultValue: 'personal',
    options: {
      options: [
        {
          label: 'Personal',
          value: 'personal',
        },
        {
          label: 'Organization',
          value: 'organization',
        },
      ],
    },
  }),
};

export async function getTimezones(): Promise<string[]> {
  const timezones = await httpClient.sendRequest({
    url: 'http://worldtimeapi.org/api/timezone',
    method: HttpMethod.GET,
  });

  return timezones.body as string[];
}

export async function getEvents(
  auth: string
): Promise<{ id: string; session: { name: string } }[]> {
  const response = await httpClient.sendRequest<
    { id: string; session: { name: string } }[]
  >({
    method: HttpMethod.GET,
    url: `${baseUrl}/events`,
    headers: {
      'x-api-key': auth,
    },
  });

  return response.body;
}

export function slugify(string: string) {
  // Remove leading and trailing whitespaces
  const trimmedStr = string.trim();

  // Replace spaces with dashes, remove special characters, and convert to lowercase
  const slug = trimmedStr
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove non-word characters (alphanumeric, underscores, and dashes)
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-'); // Replace consecutive dashes with a single dash

  return slug;
}

export async function createWebhook(
  trigger: SessionsUsWebhookTrigger,
  auth: string,
  webhookUrl: string,
  permission: string
): Promise<{ id: string }> {
  const response = await httpClient.sendRequest({
    url: `${baseUrl}/webhooks`,
    method: HttpMethod.POST,
    headers: {
      'x-api-key': auth,
    },
    body: {
      url: webhookUrl,
      trigger: trigger,
      permission: permission,
      // If the API key used to create this webhook is deleted, deletes the webhook
      linkPublicKey: true,
      // This needs to be ACTIVE_PIECES as set up by the Sessions.us team, makes the webhook not editable from the frontend
      integration: 'ACTIVE_PIECES',
    },
  });

  return response.body as { id: string };
}

export async function deleteWebhook(webhookId: string, auth: string) {
  const response = await httpClient.sendRequest({
    url: `${baseUrl}/webhooks/${webhookId}`,
    method: HttpMethod.DELETE,
    headers: {
      'x-api-key': auth,
    },
  });

  return response.body;
}

export enum SessionsUsWebhookTrigger {
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
  EVENT_NEW_REGISTRATION = 'EVENT_NEW_REGISTRATION',
  TRANSCRIPT_READY = 'TRANSCRIPT_READY',
  TAKEAWAY_READY = 'TAKEAWAY_READY',
}

export function createSessionsUsWebhookTrigger(
  data: CreateWebhookTriggerDto
): Trigger {
  return createTrigger({
    auth: sessionAuth,
    name: data.name,
    displayName: data.displayName,
    description: data.description,
    type: TriggerStrategy.WEBHOOK,
    sampleData: data.sampleData ?? {},
    props: {
      permission: properties.permission,
    },
    async onEnable({ auth, store, webhookUrl, propsValue }) {
      const webhookId = await createWebhook(
        data.trigger,
        auth,
        webhookUrl,
        propsValue.permission
      );

      await store.put(data.storeKey, {
        webhookId: webhookId.id,
      });
    },
    async onDisable({ auth, store }) {
      const webhookId: {
        webhookId: string;
      } | null = await store.get(data.storeKey);
      if (webhookId) {
        await deleteWebhook(webhookId.webhookId, auth);
      }
    },
    async run({ payload }) {
      const body = payload.body as { trigger: string; data: unknown };
      return [body.data];
    },
  });
}

export interface CreateWebhookTriggerDto {
  name: string;
  displayName: string;
  description: string;
  sampleData?: unknown;
  trigger: SessionsUsWebhookTrigger;
  storeKey: string;
}
