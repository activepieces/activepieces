import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const updateIntegration = createAction({
  auth: villageAuth,
  name: 'update_integration',
  displayName: 'Update Gmail Integration',
  description:
    'Update settings for a connected Gmail integration — adjust rate limits, timezone, status, or set as the default sending account. Provide only the fields you want to change.',
  audience: 'both',
  aiMetadata: {
    description:
      'Update settings on an existing connected Gmail integration by numeric ID: email send rate limits, minimum delay, timezone, connection status, or default-sender flag. Idempotent: only the supplied fields change and re-applying the same values is a no-op. Use List Gmail Integrations to find the ID first.',
    idempotent: true,
  },
  props: {
    id: Property.Number({
      displayName: 'Integration ID',
      description: 'Numeric ID of the integration to update',
      required: true,
    }),
    email_sending_per_day: Property.Number({
      displayName: 'Emails Per Day',
      description: 'Daily email sending limit (1-500)',
      required: false,
    }),
    email_sending_per_hour: Property.Number({
      displayName: 'Emails Per Hour',
      description: 'Hourly email sending limit (1-100)',
      required: false,
    }),
    email_sending_min_delay_seconds: Property.Number({
      displayName: 'Minimum Delay (seconds)',
      description: 'Minimum delay between emails in seconds (60-3600)',
      required: false,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'Timezone for scheduling, e.g. "America/New_York"',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Integration status',
      required: false,
      options: {
        options: [
          { label: 'Connected', value: 'connected' },
          { label: 'Disconnected', value: 'disconnected' },
          { label: 'Failed', value: 'failed' },
        ],
      },
    }),
    email_sending_default: Property.Checkbox({
      displayName: 'Set as Default',
      description: 'Whether this should be the default integration for email sending',
      required: false,
    }),
  },
  async run(context) {
    const {
      id,
      email_sending_per_day,
      email_sending_per_hour,
      email_sending_min_delay_seconds,
      timezone,
      status,
      email_sending_default,
    } = context.propsValue;

    const assertRange = (value: number, min: number, max: number, field: string): void => {
      if (!Number.isInteger(value) || value < min || value > max) {
        throw new Error(`${field} must be an integer between ${min} and ${max} (got ${value})`);
      }
    };

    const body: Record<string, unknown> = {};
    if (email_sending_per_day !== undefined && email_sending_per_day !== null) {
      assertRange(email_sending_per_day, 1, 500, 'email_sending_per_day');
      body['email_sending_per_day'] = email_sending_per_day;
    }
    if (email_sending_per_hour !== undefined && email_sending_per_hour !== null) {
      assertRange(email_sending_per_hour, 1, 100, 'email_sending_per_hour');
      body['email_sending_per_hour'] = email_sending_per_hour;
    }
    if (
      email_sending_min_delay_seconds !== undefined &&
      email_sending_min_delay_seconds !== null
    ) {
      assertRange(email_sending_min_delay_seconds, 60, 3600, 'email_sending_min_delay_seconds');
      body['email_sending_min_delay_seconds'] = email_sending_min_delay_seconds;
    }
    if (timezone !== undefined && timezone !== null && timezone !== '') {
      body['timezone'] = timezone;
    }
    if (status !== undefined && status !== null) {
      body['status'] = status;
    }
    if (email_sending_default !== undefined && email_sending_default !== null) {
      body['email_sending_default'] = email_sending_default;
    }

    if (Object.keys(body).length === 0) {
      throw new Error(
        'At least one field must be provided for update (email_sending_per_day, email_sending_per_hour, email_sending_min_delay_seconds, timezone, status, or email_sending_default)',
      );
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `${VILLAGE_API_BASE_URL}/v2/integrations/${id}`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      body,
    });
    return response.body;
  },
});
