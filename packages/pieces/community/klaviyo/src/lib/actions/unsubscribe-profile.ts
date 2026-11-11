import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { listIdDropdown, profileIdsMultiSelectDropdown } from '../common/props';
import {
  ConsentChannel,
  consentProfiles,
  jobIdOf,
  klaviyoApi,
  normalizeProfileIds,
  unsubscribeJobBody,
} from '../common/client';
import { klaviyoInputs } from '../common/ai-props';
import { klaviyoOutputSchemas } from '../common/output-schemas';

export const unsubscribeProfile = createAction({
  auth: klaviyoAuth,
  name: 'unsubscribeProfile',
  classification: 'DESTRUCTIVE',
  displayName: 'Unsubscribe Profile',
  description: 'Unsubscribe profiles from email or SMS marketing, optionally on a list. Profiles not in the selected list are unsubscribed globally. Klaviyo queues the change; Job ID is null when Klaviyo returns no job ID.',
  audience: 'human',
  aiMetadata: {
    description: 'Opts profiles out of email, SMS, and/or SMS transactional consent via a bulk unsubscribe job, optionally scoped to a list. Profiles not in the selected list are unsubscribed globally. At least one channel must be selected (max 100 profiles). Idempotent: repeating it leaves the profiles unsubscribed.',
    idempotent: true,
  },
  outputSchema: klaviyoOutputSchemas.unsubscribeProfile,
  props: {
    list_id: listIdDropdown,
    profile_ids: profileIdsMultiSelectDropdown,
    unsubscribe_email: Property.Checkbox({
      displayName: 'Unsubscribe from Email',
      description: 'Unsubscribe selected profiles from email marketing.',
      required: false,
      defaultValue: true,
    }),
    unsubscribe_sms: Property.Checkbox({
      displayName: 'Unsubscribe from SMS',
      description: 'Unsubscribe selected profiles from SMS marketing.',
      required: false,
      defaultValue: false,
    }),
    unsubscribe_sms_transactional: Property.Checkbox({
      displayName: 'Unsubscribe from SMS Transactional',
      description:
        'Unsubscribe selected profiles from SMS transactional messages.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { unsubscribe_email, unsubscribe_sms, unsubscribe_sms_transactional } = propsValue;
    const listId = klaviyoInputs.optionalText(propsValue.list_id);
    const profileIds = normalizeProfileIds(propsValue.profile_ids);
    if (profileIds.length === 0) {
      throw new Error('At least one profile must be selected.');
    }
    if (profileIds.length > 100) {
      throw new Error('Maximum of 100 profiles can be unsubscribed at once.');
    }
    const channels: ConsentChannel[] = [];
    if (unsubscribe_email) {
      channels.push('email');
    }
    if (unsubscribe_sms) {
      channels.push('sms');
    }
    if (unsubscribe_sms_transactional) {
      channels.push('sms_transactional');
    }
    if (channels.length === 0) {
      throw new Error('At least one unsubscribe channel must be selected.');
    }
    const profiles = await consentProfiles({ auth, profileIds, channels });
    const response = await klaviyoApi.send({
      auth,
      method: HttpMethod.POST,
      path: '/profile-subscription-bulk-delete-jobs',
      body: unsubscribeJobBody({ profiles, listId }),
    });
    return {
      success: true,
      job_id: jobIdOf(response.body),
      profiles_count: profiles.length,
      list_id: listId ?? null,
      unsubscribed_email: unsubscribe_email ?? false,
      unsubscribed_sms: unsubscribe_sms ?? false,
      unsubscribed_sms_transactional: unsubscribe_sms_transactional ?? false,
    };
  },
});
