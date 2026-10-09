import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';
import { heartbeatGroups } from '../common/groups';

export const addUsersToGroupAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_add_users_to_group',
  classification: 'WRITE',
  displayName: 'Add Members to Group',
  description: 'Adds members to a group by email, optionally moving them out of sibling groups.',
  audience: 'both',
  aiMetadata: {
    description: 'Adds existing members (by email) to a group, optionally removing them from sibling groups under the same parent to move them between stages. Heartbeat silently ignores emails that are not members, so they are listed in notAdded (if the read-back fails, all emails are listed in unverified with lookupError set). Adding existing group members changes nothing, so it is idempotent.',
    idempotent: true,
  },
  props: {
    groupId: heartbeatProps.id({ displayName: 'Group ID', description: 'Use List Groups to find the ID.', required: true }),
    emails: heartbeatProps.emails({ displayName: 'Member Emails', description: '1-100 emails of existing members.', required: true }),
    removeFromSiblingGroups: Property.Checkbox({
      displayName: 'Remove from Sibling Groups',
      description: 'Also remove these members from other groups with the same parent group (moves them between stages).',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: heartbeatOutputSchemas.groupMembership,
  async run({ auth, propsValue }) {
    const groupId = heartbeatApi.uuid({ value: propsValue.groupId, label: 'Group ID' });
    const emails = heartbeatApi.emailList({ value: propsValue.emails, label: 'Member Emails', min: 1 });
    await heartbeatApi.request({
      token: auth.secret_text,
      method: HttpMethod.PUT,
      path: `/groups/${groupId}/memberships`,
      operation: 'add members to group',
      body: { emails, shouldRemoveFromSiblingGroups: propsValue.removeFromSiblingGroups === true },
    });
    const lookup = await heartbeatApi.afterWrite({
      what: 'the group members',
      load: async () => heartbeatGroups.memberEmails(await heartbeatGroups.getGroup({ token: auth.secret_text, groupId })),
    });
    const members = lookup.value;
    return {
      groupId,
      emails,
      added: members === null ? [] : emails.filter((email) => members.has(email.toLowerCase())),
      notAdded: members === null ? [] : emails.filter((email) => !members.has(email.toLowerCase())),
      unverified: members === null ? emails : [],
      lookupError: lookup.lookupError,
    };
  },
});
