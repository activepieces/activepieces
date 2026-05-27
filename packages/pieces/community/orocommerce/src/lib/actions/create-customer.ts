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
  baseAddressArrayItemProps,
  addressTypeProps,
  buildIncludedAddress,
  additionalAttributesProp,
  additionalRelationsProp,
} from '../common';
import { OroAuth } from '../common/types';
import { jsonApiBodyUtils } from '../common/jsonapi-body-utils';

export const createCustomerAction = createAction({
  auth: oroAuth,
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Creates a new customer (company) record in OroCommerce.',
  props: {
    // -- Required attributes ---------------------------------------------------
    name: Property.ShortText({
      displayName: 'Name',
      description:
        'A human-readable name that identifies the customer (company).',
      required: true,
    }),

    // -- Optional attributes ---------------------------------------------------
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

    // -- Optional relationships ------------------------------------------------
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

    // -- Addresses -------------------------------------------------------------
    addresses: Property.Array({
      displayName: 'Addresses',
      description: 'Customer addresses to create along with the customer.',
      required: false,
      properties: {
        ...baseAddressArrayItemProps,
        primary: Property.Checkbox({
          displayName: 'Primary',
          description: 'Mark this address as the primary customer address.',
          required: false,
        }),
        ...addressTypeProps,
      },
    }),
    additionalAttributes: additionalAttributesProp,
    additionalRelations: additionalRelationsProp,
  },

  async run(context) {
    const p = context.propsValue;

    const included: Record<string, unknown>[] = [];

    const rawAddresses = (p.addresses ?? []) as Array<Record<string, unknown>>;
    const addressRelData = rawAddresses.map((addr, index) => {
      const lid = `addr_${index + 1}`;
      included.push(
        buildIncludedAddress({ lid, type: 'customeraddresses', addr })
      );
      return { type: 'customeraddresses', id: lid };
    });

    const extraAttrs = jsonApiBodyUtils.parseAdditionalAttributes(p.additionalAttributes);
    const extraRels = jsonApiBodyUtils.parseAdditionalRelations(p.additionalRelations);

    const attributes = {
      name: p.name,
      ...jsonApiBodyUtils.pickDefined({
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
      ...(addressRelData.length > 0
        ? { addresses: { data: addressRelData } }
        : {}),
      ...extraRels,
    };

    const body: Record<string, unknown> = {
      data: { type: 'customers', attributes, relationships },
    };
    if (included.length > 0) body['included'] = included;

    const response = await oroApiCall({
      method: HttpMethod.POST,
      resourceUri: '/customers',
      auth: context.auth as OroAuth,
      body,
    });

    return response.body;
  },
});
