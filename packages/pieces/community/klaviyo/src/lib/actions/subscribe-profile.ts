import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { allProfileIdsMultiSelectDropdown, listIdDropdown } from '../common/props';
import {
  ConsentChannel,
  consentProfiles,
  jobIdOf,
  klaviyoApi,
  normalizeProfileIds,
  subscribeJobBody,
} from '../common/client';
import { klaviyoInputs } from '../common/ai-props';
import { klaviyoOutputSchemas } from '../common/output-schemas';

export const subscribeProfile = createAction({
  auth: klaviyoAuth,
  name: 'subscribeProfile',
  classification: 'WRITE',
  displayName: 'Subscribe Profile',
  description: 'Subscribe profiles to email or SMS marketing, optionally on a list. This grants marketing consent: it re-subscribes profiles that had unsubscribed or were suppressed, and a double opt-in list sends a confirmation email. Klaviyo queues the change; Job ID is null when Klaviyo returns no job ID.',
  audience: 'human',
  aiMetadata: {
    description: 'Opts profiles in to email and/or SMS marketing consent via a bulk subscription job, optionally scoped to a list. Grants consent: it lifts unsubscribe, spam-report and manual suppressions, and a double opt-in list sends a confirmation email. Enabling historical import bypasses double opt-in and requires a consent date. Not idempotent: a repeat may send another confirmation email (max 1000 profiles).',
    idempotent: false,
  },
  outputSchema: klaviyoOutputSchemas.subscribeProfile,
  props: {
    list_id: listIdDropdown,
    profile_ids: allProfileIdsMultiSelectDropdown,
    subscribe_email: Property.Checkbox({
      displayName: 'Subscribe to Email',
      description: 'Subscribe selected profiles to email marketing.',
      required: false,
      defaultValue: true,
    }),
    subscribe_sms: Property.Checkbox({
      displayName: 'Subscribe to SMS',
      description: 'Subscribe selected profiles to SMS marketing.',
      required: false,
      defaultValue: false,
    }),
    historical_import: Property.Checkbox({
      displayName: 'Historical Import',
      description: 'Bypass double opt-in and mark as a historical import.',
      required: false,
      defaultValue: false,
    }),
    consented_at: Property.ShortText({
      displayName: 'Consent Date',
      description:
        'ISO 8601 datetime when consent was given (required for historical import, e.g. 2024-01-15T10:00:00Z).',
      required: false,
    }),
    custom_source: Property.ShortText({
      displayName: 'Custom Source',
      description: 'Label for the subscription source (e.g. "Website Form").',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { subscribe_email, subscribe_sms, historical_import } = propsValue;
    const listId = klaviyoInputs.optionalText(propsValue.list_id);
    const consentedAt = klaviyoInputs.isoDateTime({ value: propsValue.consented_at, label: 'Consent Date' });
    const customSource = klaviyoInputs.optionalText(propsValue.custom_source);
    const profileIds = normalizeProfileIds(propsValue.profile_ids);
    if (profileIds.length === 0) {
      throw new Error('At least one profile must be selected.');
    }
    if (profileIds.length > 1000) {
      throw new Error('Maximum of 1000 profiles can be subscribed at once.');
    }
    if (!subscribe_email && !subscribe_sms) {
      throw new Error(
        'At least one subscription channel must be selected (Email or SMS).'
      );
    }
    if (historical_import && consentedAt === undefined) {
      throw new Error(
        'Consent Date is required when Historical Import is enabled.'
      );
    }
    const channels: ConsentChannel[] = [];
    if (subscribe_email) {
      channels.push('email');
    }
    if (subscribe_sms) {
      channels.push('sms');
    }
    const profiles = await consentProfiles({ auth, profileIds, channels });
    const response = await klaviyoApi.send({
      auth,
      method: HttpMethod.POST,
      path: '/profile-subscription-bulk-create-jobs',
      body: subscribeJobBody({
        profiles,
        listId,
        customSource,
        historicalImport: historical_import === true,
        consentedAt,
      }),
    });
    return {
      success: true,
      job_id: jobIdOf(response.body),
      profiles_count: profiles.length,
      list_id: listId ?? null,
      subscribed_email: subscribe_email ?? false,
      subscribed_sms: subscribe_sms ?? false,
      historical_import: historical_import ?? false,
    };
  },
});
