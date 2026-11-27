import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const POLICY_TYPES = ['finite', 'indefinite'];
const DISPOSITION_ACTIONS = ['permanently_delete', 'remove_retention'];
const RETENTION_TYPES = ['modifiable', 'non_modifiable'];

export const createRetentionPolicyAction = createAction({
  auth: boxAuth,
  name: 'box_create_retention_policy',
  displayName: 'Create Retention Policy',
  description: 'Creates a retention policy in the Box enterprise.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates an enterprise retention policy and returns its ID; it retains nothing until applied with Assign Retention Policy. A "finite" policy needs Retention Length in days. Needs admin rights and Box Governance.',
    idempotent: false,
  },
  props: {
    policyName: Property.ShortText({ displayName: 'Policy Name', description: 'Name of the policy.', required: true }),
    policyType: Property.StaticDropdown({
      displayName: 'Policy Type',
      description: '"finite" (a known number of days) or "indefinite".',
      required: true,
      options: { options: POLICY_TYPES.map((value) => ({ label: value, value })) },
    }),
    dispositionAction: Property.StaticDropdown({
      displayName: 'Disposition Action',
      description: 'What happens when retention ends: "permanently_delete" deletes the content, "remove_retention" lets users delete it.',
      required: true,
      options: { options: DISPOSITION_ACTIONS.map((value) => ({ label: value, value })) },
    }),
    retentionLength: Property.ShortText({
      displayName: 'Retention Length',
      description: 'Days to retain content after it is assigned, e.g. "365". Required for "finite" policies.',
      required: false,
    }),
    description: Property.LongText({ displayName: 'Description', description: 'Description of the policy.', required: false }),
    retentionType: Property.StaticDropdown({
      displayName: 'Retention Type',
      description: '"modifiable" (default; can be shortened or unassigned) or "non_modifiable" (regulatory: can only be lengthened or retired, irreversible).',
      required: false,
      options: { options: RETENTION_TYPES.map((value) => ({ label: value, value })) },
    }),
    canOwnerExtendRetention: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Owner Can Extend',
      description: '"true" or "false": whether file owners can extend the retention.',
    }),
    maxExtensionLength: Property.ShortText({
      displayName: 'Max Extension Length',
      description: 'Most days an owner can extend retention, or "none". Only for "finite" policies with "permanently_delete".',
      required: false,
    }),
    areOwnersNotified: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Notify Owners',
      description: '"true" or "false": whether file owners and co-owners are notified before retention ends.',
    }),
    customNotificationRecipientIds: Property.Array({
      displayName: 'Notification Recipient IDs',
      description: 'User IDs to notify before retention ends. Get them from List Users.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    if (!POLICY_TYPES.includes(propsValue.policyType)) {
      throw new Error(`Policy Type must be one of: ${POLICY_TYPES.join(', ')}.`);
    }
    if (!DISPOSITION_ACTIONS.includes(propsValue.dispositionAction)) {
      throw new Error(`Disposition Action must be one of: ${DISPOSITION_ACTIONS.join(', ')}.`);
    }
    if (propsValue.retentionType !== undefined && !RETENTION_TYPES.includes(propsValue.retentionType)) {
      throw new Error(`Retention Type must be one of: ${RETENTION_TYPES.join(', ')}.`);
    }
    const recipients = propsValue.customNotificationRecipientIds?.length
      ? propsValue.customNotificationRecipientIds.map((id) => ({ type: 'user', id: String(id) }))
      : undefined;
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/retention_policies',
      body: {
        policy_name: propsValue.policyName,
        policy_type: propsValue.policyType,
        disposition_action: propsValue.dispositionAction,
        ...(propsValue.retentionLength !== undefined ? { retention_length: propsValue.retentionLength } : {}),
        ...(propsValue.description !== undefined ? { description: propsValue.description } : {}),
        ...(propsValue.retentionType !== undefined ? { retention_type: propsValue.retentionType } : {}),
        ...(propsValue.canOwnerExtendRetention !== undefined
          ? { can_owner_extend_retention: propsValue.canOwnerExtendRetention === 'true' }
          : {}),
        ...(propsValue.maxExtensionLength !== undefined ? { max_extension_length: propsValue.maxExtensionLength } : {}),
        ...(propsValue.areOwnersNotified !== undefined ? { are_owners_notified: propsValue.areOwnersNotified === 'true' } : {}),
        ...(recipients !== undefined ? { custom_notification_recipients: recipients } : {}),
      },
    });
  },
});
