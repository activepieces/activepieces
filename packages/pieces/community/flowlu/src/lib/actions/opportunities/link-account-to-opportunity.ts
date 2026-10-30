import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { FlowluApiError } from '../../common/client';
import { flowluLinks } from '../../common/links';
import { flowluInput } from '../../common/utils';
import { linkOutputSchema } from '../../output-schemas';

export const linkAccountToOpportunityAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_link_account_to_opportunity',
  classification: 'WRITE',
  displayName: 'Link Account to Opportunity',
  description: 'Links a CRM contact or organization to an opportunity.',
  audience: 'both',
  aiMetadata: {
    description:
      'Links one Flowlu CRM account (contact or organization) to one opportunity, so the deal shows that customer. Checks for an existing link first and returns it with already_linked true instead of adding a duplicate, so it is safe to retry. Needs the opportunity ID, the account ID and whether the account is a contact or an organization.',
    idempotent: true,
  },
  props: {
    opportunity_id: Property.ShortText({
      displayName: 'Opportunity ID',
      description: 'Numeric opportunity ID, such as "42".',
      required: true,
    }),
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description:
        'Numeric ID of the contact or organization to link, such as "17".',
      required: true,
    }),
    account_type: Property.StaticDropdown({
      displayName: 'Account Type',
      description:
        'Whether the account is a contact (person) or an organization (company).',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Organization', value: 'organization' },
          { label: 'Contact', value: 'contact' },
        ],
      },
    }),
  },
  outputSchema: linkOutputSchema,
  async run(context) {
    const leadId = flowluInput.requireId({
      value: context.propsValue.opportunity_id,
      name: 'Opportunity ID',
    });
    const accountId = flowluInput.requireId({
      value: context.propsValue.account_id,
      name: 'Account ID',
    });
    const type = context.propsValue.account_type;
    if (type !== 'organization' && type !== 'contact') {
      throw new FlowluApiError({
        message: 'Account Type must be "organization" or "contact".',
      });
    }
    return flowluLinks.linkAccountToLead({
      client: makeClient(context.auth),
      leadId,
      accountId,
      accountType: type === 'organization' ? 1 : 2,
    });
  },
});
