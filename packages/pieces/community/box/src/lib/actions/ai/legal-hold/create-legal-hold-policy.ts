import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const createLegalHoldPolicyAction = createAction({
  auth: boxAuth,
  name: 'box_create_legal_hold_policy',
  displayName: 'Create Legal Hold Policy',
  description: 'Creates a legal hold policy in the Box enterprise.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a legal hold policy and returns its ID; it holds nothing until applied with Assign Legal Hold Policy. Give Is Ongoing "true", or both filter dates. Needs admin rights and Box Governance.',
    idempotent: false,
  },
  props: {
    policyName: Property.ShortText({ displayName: 'Policy Name', description: 'Name of the policy.', required: true }),
    description: Property.LongText({ displayName: 'Description', description: 'Description of the policy.', required: false }),
    isOngoing: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Is Ongoing',
      description: '"true": keep holding new file versions created after the policy is assigned, until it is released. Required when no filter dates are given.',
    }),
    filterStartedAt: Property.DateTime({
      displayName: 'Filter Start',
      description: 'ISO 8601. For user (custodian) assignments, only hold file versions created from this date. Required when Is Ongoing is "false".',
      required: false,
    }),
    filterEndedAt: Property.DateTime({
      displayName: 'Filter End',
      description: 'ISO 8601. For user (custodian) assignments, only hold file versions created up to this date. Required when Is Ongoing is "false".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    if ((propsValue.filterStartedAt === undefined) !== (propsValue.filterEndedAt === undefined)) {
      throw new Error('Give both Filter Start and Filter End, or neither.');
    }
    if (propsValue.isOngoing !== 'true' && propsValue.filterStartedAt === undefined) {
      throw new Error('Give Is Ongoing "true", or both Filter Start and Filter End.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/legal_hold_policies',
      body: {
        policy_name: propsValue.policyName,
        ...(propsValue.description !== undefined ? { description: propsValue.description } : {}),
        ...(propsValue.isOngoing !== undefined ? { is_ongoing: propsValue.isOngoing === 'true' } : {}),
        ...(propsValue.filterStartedAt !== undefined ? { filter_started_at: propsValue.filterStartedAt } : {}),
        ...(propsValue.filterEndedAt !== undefined ? { filter_ended_at: propsValue.filterEndedAt } : {}),
      },
    });
  },
});
