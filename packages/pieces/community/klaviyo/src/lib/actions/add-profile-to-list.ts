import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { allProfileIdsMultiSelectDropdown, listIdDropdown } from '../common/props';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApi, normalizeProfileIds, pathFor } from '../common/client';
import { klaviyoInputs } from '../common/ai-props';
import { klaviyoOutputSchemas } from '../common/output-schemas';

export const addProfileToList = createAction({
  auth: klaviyoAuth,
  name: 'addProfileToList',
  classification: 'WRITE',
  displayName: 'Add Profile to List',
  description:
    'Add profiles to a specific list without changing subscription status.',
  audience: 'both',
  aiMetadata: {
    description: 'Adds one or more existing profiles (by profile ID) to a Klaviyo list as members, without altering their email/SMS subscription consent. Use to manage list membership; for opt-in/consent changes use Subscribe Profile to Marketing instead. Requires a list ID and 1-1000 profile IDs; idempotent, since re-adding an existing member is a no-op.',
    idempotent: true,
  },
  outputSchema: klaviyoOutputSchemas.listMembershipAdded,
  props: {
    list_id: listIdDropdown,
    profile_id: allProfileIdsMultiSelectDropdown,
  },
  async run({ auth, propsValue }) {
    const listId = klaviyoInputs.requireText({ value: propsValue.list_id, label: 'List Id' });
    const profileIds = normalizeProfileIds(propsValue.profile_id);
    if (profileIds.length === 0) {
      throw new Error('At least one profile is required');
    }
    if (profileIds.length > MAX_PROFILES) {
      throw new Error(`Maximum of ${MAX_PROFILES} profiles can be added at once`);
    }
    await klaviyoApi.send({
      auth,
      method: HttpMethod.POST,
      path: `${pathFor(['lists', listId])}/relationships/profiles`,
      body: { data: profileIds.map((id) => ({ type: 'profile', id })) },
    });
    return {
      success: true,
      message: `Successfully added ${profileIds.length} profile(s) to list`,
      profiles_added: profileIds.length,
    };
  },
});

const MAX_PROFILES = 1000;
