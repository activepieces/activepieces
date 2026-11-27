import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const DISPOSITION_ACTIONS = ['permanently_delete', 'remove_retention'];
const RETENTION_TYPES = ['non-modifiable'];
const STATUSES = ['retired'];

export const updateRetentionPolicyAction = createAction({
  auth: boxAuth,
  name: 'box_update_retention_policy',
  displayName: 'Update Retention Policy',
  description: 'Changes or retires a Box retention policy.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes a retention policy\'s name, description, length, disposition action or notification settings, or retires it with Status "retired"; only the fields given change. Making a policy non-modifiable and retiring it cannot be undone. Get the ID from List Retention Policies.',
    idempotent: true,
  },
  props: {
    retentionPolicyId: boxAiProps.retentionPolicyId({ required: true }),
    policyName: Property.ShortText({ displayName: 'Policy Name', description: 'New name.', required: false }),
    description: Property.LongText({ displayName: 'Description', description: 'New description.', required: false }),
    dispositionAction: Property.StaticDropdown({
      displayName: 'Disposition Action',
      description: '"permanently_delete" or "remove_retention".',
      required: false,
      options: { options: DISPOSITION_ACTIONS.map((value) => ({ label: value, value })) },
    }),
    retentionLength: Property.ShortText({
      displayName: 'Retention Length',
      description: 'New retention length in days, e.g. "730". Non-modifiable policies can only be lengthened.',
      required: false,
    }),
    retentionType: Property.StaticDropdown({
      displayName: 'Retention Type',
      description: '"non-modifiable" converts a modifiable policy for good; it cannot be converted back.',
      required: false,
      options: { options: RETENTION_TYPES.map((value) => ({ label: value, value })) },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: '"retired" retires the policy. Leave empty otherwise.',
      required: false,
      options: { options: STATUSES.map((value) => ({ label: value, value })) },
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
      description: 'The full new list of user IDs to notify before retention ends. Get them from List Users.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.dispositionAction !== undefined && !DISPOSITION_ACTIONS.includes(propsValue.dispositionAction)) {
      throw new Error(`Disposition Action must be one of: ${DISPOSITION_ACTIONS.join(', ')}.`);
    }
    if (propsValue.retentionType !== undefined && !RETENTION_TYPES.includes(propsValue.retentionType)) {
      throw new Error(`Retention Type must be one of: ${RETENTION_TYPES.join(', ')}.`);
    }
    if (propsValue.status !== undefined && !STATUSES.includes(propsValue.status)) {
      throw new Error(`Status must be one of: ${STATUSES.join(', ')}.`);
    }
    const recipients = propsValue.customNotificationRecipientIds?.length
      ? propsValue.customNotificationRecipientIds.map((id) => ({ type: 'user', id: String(id) }))
      : undefined;
    const body = {
      ...(propsValue.policyName !== undefined ? { policy_name: propsValue.policyName } : {}),
      ...(propsValue.description !== undefined ? { description: propsValue.description } : {}),
      ...(propsValue.dispositionAction !== undefined ? { disposition_action: propsValue.dispositionAction } : {}),
      ...(propsValue.retentionLength !== undefined ? { retention_length: propsValue.retentionLength } : {}),
      ...(propsValue.retentionType !== undefined ? { retention_type: propsValue.retentionType } : {}),
      ...(propsValue.status !== undefined ? { status: propsValue.status } : {}),
      ...(propsValue.canOwnerExtendRetention !== undefined
        ? { can_owner_extend_retention: propsValue.canOwnerExtendRetention === 'true' }
        : {}),
      ...(propsValue.maxExtensionLength !== undefined ? { max_extension_length: propsValue.maxExtensionLength } : {}),
      ...(propsValue.areOwnersNotified !== undefined ? { are_owners_notified: propsValue.areOwnersNotified === 'true' } : {}),
      ...(recipients !== undefined ? { custom_notification_recipients: recipients } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Give at least one field to update.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/retention_policies/${encodeURIComponent(propsValue.retentionPolicyId)}`,
      body,
    });
  },
});
