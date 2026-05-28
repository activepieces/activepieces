import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  oroAuth,
  oroApiCall,
  customerDropdown,
  customerGroupDropdown,
  customerTaxCodeDropdown,
  customerRatingDropdown,
  organizationDropdown,
  userDropdown,
  paymentTermDropdown,
  additionalAttributesProp,
  additionalRelationsProp,
  additionalHeadersProp,
} from '../common';
import { OroAuth } from '../common/types';
import { jsonApiBodyUtils } from '../common/jsonapi-body-utils';

export const updateCustomerAction = createAction({
  auth: oroAuth,
  name: 'update_customer',
  displayName: 'Update Customer',
  description:
    'Updates an existing customer (company) record in OroCommerce. Only provided fields are changed.',
  props: {
    // -- Target record ---------------------------------------------------------
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The numeric ID of the customer to update.',
      required: true,
    }),

    // -- Attributes ------------------------------------------------------------
    name: Property.ShortText({
      displayName: 'Name',
      description:
        'A human-readable name that identifies the customer (company).',
      required: false,
    }),
    externalId: Property.ShortText({
      displayName: 'External ID',
      description: 'A unique identifier from an external system.',
      required: false,
    }),
    vat_id: Property.ShortText({
      displayName: 'VAT ID',
      description: "Customer's value added tax identification number.",
      required: false,
    }),

    // -- Relationships ---------------------------------------------------------
    parent: {
      ...customerDropdown,
      displayName: 'Parent Customer',
      description: 'The parent company this customer (division) reports to.',
    },
    group: customerGroupDropdown,
    taxCode: customerTaxCodeDropdown,
    internalRating: customerRatingDropdown,
    owner: userDropdown,
    organization: organizationDropdown,
    paymentTerm: paymentTermDropdown,
    additionalAttributes: additionalAttributesProp,
    additionalRelations: additionalRelationsProp,
    additionalHeaders: additionalHeadersProp,
  },

  async run(context) {
    const p = context.propsValue;

    const extraAttrs = jsonApiBodyUtils.parseAdditionalAttributes(p.additionalAttributes);
    const extraRels = jsonApiBodyUtils.parseAdditionalRelations(p.additionalRelations);

    const attributes = {
      ...jsonApiBodyUtils.pickDefined({
        name: p.name,
        externalId: p.externalId,
        vat_id: p.vat_id,
      }),
      ...extraAttrs,
    };

    const relationships = {
      ...jsonApiBodyUtils.buildRels({
        parent: ['customers', p.parent],
        group: ['customergroups', p.group],
        taxCode: ['customertaxcodes', p.taxCode],
        internal_rating: ['customerratings', p.internalRating],
        owner: ['users', p.owner],
        organization: ['organizations', p.organization],
        paymentTerm: ['paymentterms', p.paymentTerm],
      }),
      ...extraRels,
    };

    const response = await oroApiCall({
      method: HttpMethod.PATCH,
      resourceUri: `/customers/${p.customerId}`,
      auth: context.auth as OroAuth,
      body: {
        data: {
          type: 'customers',
          id: p.customerId,
          attributes,
          relationships,
        },
      },
      headers: p.additionalHeaders as Record<string, string>,
    });

    return response.body;
  },
});
