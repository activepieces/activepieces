import { createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { pipedriveCommon } from '../common'; // Assuming pipedriveCommon handles v2 internally or will be updated
import { pipedriveAuth } from '../..';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

// Define the structure for a Pipedrive Activity in v2
interface PipedriveActivityV2 {
  id: number;
  subject: string;
  owner_id: number; // Renamed from user_id
  type: string;
  is_deleted: boolean; // Replaces active_flag, is negation of old value
  done: boolean;
  conference_meeting_client: string | null;
  conference_meeting_url: string | null;
  conference_meeting_id: string | null;
  due_date: string; // YYYY-MM-DD
  due_time: string; // HH:MM
  duration: string; // HH:MM
  busy: boolean; // Renamed from busy_flag
  add_time: string; // RFC 3339 format
  update_time: string; // RFC 3339 format
  marked_as_done_time: string | null; // RFC 3339 format, null if not done
  public_description: string | null;
  location: { // Nested object now
    value: string | null;
    street_number: string | null;
    route: string | null;
    sublocality: string | null;
    locality: string | null;
    admin_area_level_1: string | null;
    admin_area_level_2: string | null;
    country: string | null;
    postal_code: string | null;
    formatted_address: string | null;
  } | null;
  org_id: number | null;
  person_id: number | null;
  deal_id: number | null;
  lead_id: string | null;
  project_id: number | null;
  private: boolean;
  priority: number;
  note: string | null;
  creator_user_id: number; // Renamed from created_by_user_id
  attendees?: { // Included only when using include_fields parameter
    email_address: string;
    name: string;
    status: string;
    is_organizer: number;
    person_id: number | null;
    user_id: number | null;
  }[];
  participants?: {
    person_id: number;
    primary_flag: boolean;
  }[];
  // Removed fields are not included here
}

// Update ListActivitiesResponse to reflect v2 structure
interface ListActivitiesResponse {
  data: PipedriveActivityV2[];
  // Other pagination/meta fields if present in Pipedrive's actual response
}

export const newActivity = createTrigger({
  auth: pipedriveAuth,
  name: 'new_activity',
  displayName: 'New Activity',
  description: 'Triggers when a new activity is added',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Assuming pipedriveCommon.subscribeWebhook is already updated or will be updated
    // to correctly interact with Pipedrive's v2 webhook API.
    const webhook = await pipedriveCommon.subscribeWebhook(
      'activity',
      'added',
      context.webhookUrl!,
      context.auth.data['api_domain'],
      context.auth.access_token
    );
    await context.store?.put<WebhookInformation>('_new_activity_trigger', {
      webhookId: webhook.data.id,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_new_activity_trigger'
    );
    if (response !== null && response !== undefined) {
      // Assuming pipedriveCommon.unsubscribeWebhook is already updated or will be updated
      // to correctly interact with Pipedrive's v2 webhook API.
      await pipedriveCommon.unsubscribeWebhook(
        response.webhookId,
        context.auth.data['api_domain'],
        context.auth.access_token
      );
    }
  },
  async test(context) {
    // IMPORTANT: Changed API version from v1 to v2
    const response = await httpClient.sendRequest<ListActivitiesResponse>({
      method: HttpMethod.GET,
      url: `${context.auth.data['api_domain']}/api/v2/activities`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      queryParams: {
        limit: '5',
        // If attendees are strictly required for the test sample, you might add:
        // include_fields: 'attendees'
      },
    });

    return response.body.data;
  },
  async run(context) {
    const payloadBody = context.payload.body as PayloadBody;
    // The 'current' object in the webhook payload will now be a v2 Activity Object
    return [payloadBody.current];
  },
  sampleData: {
    id: 8,
    owner_id: 1234, // Renamed from user_id
    done: false,
    type: 'deadline',
    // Removed reference_type, reference_id, conference_meeting_client, conference_meeting_url, conference_meeting_id
    due_date: '2020-06-09',
    due_time: '10:00',
    duration: '01:00',
    busy: true, // Renamed from busy_flag
    add_time: '2020-06-08T12:37:56Z', // RFC 3339 format
    marked_as_done_time: '2020-08-08T08:08:38Z', // RFC 3339 format
    // Removed last_notification_time, last_notification_user_id, notification_language_id
    subject: 'Deadline',
    public_description: 'This is a description',
    // Removed calendar_sync_include_context
    location: { // Nested object
      value: 'Mustamäe tee 3, Tallinn, Estonia',
      street_number: '3',
      route: 'Mustamäe tee',
      sublocality: 'Kristiine',
      locality: 'Tallinn',
      admin_area_level_1: 'Harju maakond',
      admin_area_level_2: null, // Can be null
      country: 'Estonia',
      postal_code: '10616',
      formatted_address: 'Mustamäe tee 3, 10616 Tallinn, Estonia',
    },
    org_id: 5,
    person_id: 1101,
    deal_id: 300,
    lead_id: '46c3b0e1-db35-59ca-1828-4817378dff71',
    is_deleted: false, // Replaces active_flag, negated value
    update_time: '2020-08-08T12:37:56Z', // RFC 3339 format
    // Removed update_user_id, gcal_event_id, google_calendar_id, google_calendar_etag, source_timezone
    // Removed rec_rule, rec_rule_extension, rec_master_activity_id, series
    note: 'A note for the activity',
    creator_user_id: 1234, // Renamed from created_by_user_id
    attendees: [
      {
        email_address: 'attendee@pipedrivemail.com',
        is_organizer: 0,
        name: 'Attendee',
        person_id: 25312,
        status: 'noreply',
        user_id: null,
      },
    ],
    participants: [
      {
        person_id: 17985,
        primary_flag: false,
      },
      {
        person_id: 1101,
        primary_flag: true,
      },
    ],
    // Removed org_name, person_name, deal_title, owner_name, person_dropbox_bcc, deal_dropbox_bcc, assigned_to_user_id, file
  },
});

interface WebhookInformation {
  webhookId: string;
}

type PayloadBody = {
  current: PipedriveActivityV2; // Ensure 'current' matches the v2 activity object
  previous: PipedriveActivityV2; // Webhooks often include 'previous' state too
  event: string;
  // Other webhook payload fields
};