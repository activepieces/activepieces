import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { applyClearFields, clearFieldsProp } from '../../common/clear-fields';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostOfferOutputSchema } from '../../output-schemas';

export const ghostUpdateOffer = createAction({
  auth: ghostAuth,
  name: 'ghost_update_offer',
  outputSchema: ghostOfferOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Offer',
  description: 'Update the name, code or display text of an offer.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Edits an offer by ID; only the name, code and display text can change, not the discount terms, and Clear Fields blanks the display description. Changing the code breaks links that use the old code. Use Archive Offer to stop redemptions.',
    idempotent: true,
  },
  props: {
    offer_id: ghostProps.id('Offer ID', 'The offer ID, from List Offers.'),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The new internal name.',
      required: false,
    }),
    code: Property.ShortText({
      displayName: 'Code',
      description: 'The new offer code.',
      required: false,
    }),
    display_title: Property.ShortText({
      displayName: 'Display Title',
      description: 'The new headline shown on the offer page.',
      required: false,
    }),
    display_description: Property.LongText({
      displayName: 'Display Description',
      description: 'The new text shown on the offer page.',
      required: false,
    }),
    clear_fields: clearFieldsProp([{ label: 'Display Description', value: 'display_description' }]),
  },
  async run(context) {
    const id = ghostCommon.id(context.propsValue.offer_id, 'Offer ID');
    return ghostResource.edit(
      context.auth,
      'offers',
      id,
      applyClearFields({
        body: ghostResource.pick(context.propsValue, ['name', 'code', 'display_title', 'display_description']),
        clear: context.propsValue.clear_fields,
        allowed: ['display_description'],
        clearValue: null,
      })
    );
  },
});
