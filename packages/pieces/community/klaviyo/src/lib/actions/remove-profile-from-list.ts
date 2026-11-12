import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { listIdDropdown, profileIdsMultiSelectDropdown } from '../common/props';
import { klaviyoApi, normalizeProfileIds, pathFor } from '../common/client';
import { klaviyoInputs } from '../common/ai-props';
import { klaviyoOutputSchemas } from '../common/output-schemas';

export const removeProfileFromList = createAction({
  auth: klaviyoAuth,
  name: 'removeProfileFromList',
  classification: 'WRITE',
  displayName: 'Remove Profile from List',
  description: 'Remove profiles from a specific list.',
  audience: 'both',
  aiMetadata: {
    description: 'Removes one or more profiles (by profile ID) from a Klaviyo list, ending their membership without changing subscription consent. Use to take profiles off a list; requires a list ID and 1-1000 profile IDs. Idempotent, since removing a profile that is not a member is a no-op.',
    idempotent: true,
  },
  outputSchema: klaviyoOutputSchemas.listMembershipRemoved,
  props: {
    list_id: listIdDropdown,
    profile_ids: profileIdsMultiSelectDropdown,
  },
  async run({ propsValue, auth }) {
    const listId = klaviyoInputs.requireText({ value: propsValue.list_id, label: 'List Id' });
    const profileIds = normalizeProfileIds(propsValue.profile_ids);
    if (profileIds.length === 0) {
      throw new Error('At least one profile must be selected');
    }
    if (profileIds.length > MAX_PROFILES) {
      throw new Error(`Maximum of ${MAX_PROFILES} profiles can be removed at once`);
    }
    await klaviyoApi.send({
      auth,
      method: HttpMethod.DELETE,
      path: `${pathFor(['lists', listId])}/relationships/profiles`,
      body: { data: profileIds.map((id) => ({ type: 'profile', id })) },
    });
    return {
      success: true,
      message: `Successfully removed ${profileIds.length} profile(s) from the list`,
      profiles_removed: profileIds.length,
    };
  },
});

const MAX_PROFILES = 1000;
