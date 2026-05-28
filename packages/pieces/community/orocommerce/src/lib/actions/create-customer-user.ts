import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  oroAuth,
  oroApiCall,
  customerRequiredDropdown,
  customerUserRoleDropdown,
  organizationDropdown,
  userDropdown,
  websiteDropdown,
  baseAddressArrayItemProps,
  addressTypeProps,
  buildIncludedAddress,
  additionalAttributesProp,
  additionalRelationsProp,
  additionalHeadersProp,
} from '../common';
import { OroAuth } from '../common/types';
import { jsonApiBodyUtils } from '../common/jsonapi-body-utils';

export const createCustomerUserAction = createAction({
  auth: oroAuth,
  name: 'create_customer_user',
  displayName: 'Create Customer User',
  description:
    'Creates a new customer user (storefront account) in OroCommerce.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the customer user. Used as the login.',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Password for the new account. Must comply with the system security policy.',
      required: true,
    }),

    namePrefix: Property.ShortText({
      displayName: 'Name Prefix',
      description: 'Honorific (e.g. Mr., Ms., Dr.).',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    middleName: Property.ShortText({
      displayName: 'Middle Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: true,
    }),
    nameSuffix: Property.ShortText({
      displayName: 'Name Suffix',
      description: 'Suffix (e.g. PhD, Jr.).',
      required: false,
    }),

    // -- Required relationships ------------------------------------------------
    customer: customerRequiredDropdown,
    website: websiteDropdown,

    // -- Optional attributes ---------------------------------------------------
    enabled: Property.Checkbox({
      displayName: 'Enabled',
      description: 'When disabled the user cannot log into the storefront. Defaults to true.',
      required: false,
      defaultValue: true,
    }),
    confirmed: Property.Checkbox({
      displayName: 'Confirmed',
      description: 'Whether the user has completed email confirmation. Defaults to true.',
      required: false,
      defaultValue: true,
    }),
    birthday: Property.ShortText({
      displayName: 'Birthday',
      description: 'Birth date in YYYY-MM-DD format.',
      required: false,
    }),
    externalId: Property.ShortText({
      displayName: 'External ID',
      description: 'A unique identifier from an external system.',
      required: false,
    }),

    // -- Optional relationships ------------------------------------------------
    userRoles: customerUserRoleDropdown,
    owner: userDropdown,
    organization: organizationDropdown,

    // -- Addresses -------------------------------------------------------------
    addresses: Property.Array({
      displayName: 'Addresses',
      description: 'Customer user addresses to create along with the user.',
      required: false,
      properties: {
        ...baseAddressArrayItemProps,
        primary: Property.Checkbox({
          displayName: 'Primary',
          description: 'Mark this as the primary address.',
          required: false,
        }),
        ...addressTypeProps,
      },
    }),
    additionalAttributes: additionalAttributesProp,
    additionalRelations: additionalRelationsProp,
    additionalHeaders: additionalHeadersProp,
  },

  async run(context) {
    const p = context.propsValue;

    const included: Record<string, unknown>[] = [];

    const rawAddresses = (p.addresses ?? []) as Array<Record<string, unknown>>;
    const addressRelData = rawAddresses.map((addr, index) => {
      const lid = `cu_addr_${index + 1}`;
      included.push(
        buildIncludedAddress({ lid, type: 'customeruseraddresses', addr })
      );
      return { type: 'customeruseraddresses', id: lid };
    });

    const extraAttrs = jsonApiBodyUtils.parseAdditionalAttributes(p.additionalAttributes);
    const extraRels = jsonApiBodyUtils.parseAdditionalRelations(p.additionalRelations);

    const attributes = {
      email: p.email,
      firstName: p.firstName,
      lastName: p.lastName,
      password: p.password,
      enabled: p.enabled ?? true,
      confirmed: p.confirmed ?? true,
      ...jsonApiBodyUtils.pickDefined({
        namePrefix: p.namePrefix,
        middleName: p.middleName,
        nameSuffix: p.nameSuffix,
        birthday: p.birthday,
        externalId: p.externalId,
      }),
      ...extraAttrs,
    };

    const relationships = {
      customer: { data: { type: 'customers', id: p.customer ?? '' } },
      ...jsonApiBodyUtils.buildRels({
        website: ['websites', p.website],
        userRoles: ['customeruserroles', p.userRoles, true],
        owner: ['users', p.owner],
        organization: ['organizations', p.organization],
      }),
      ...(addressRelData.length > 0
        ? { addresses: { data: addressRelData } }
        : {}),
      ...extraRels,
    };

    const body: Record<string, unknown> = {
      data: {
        type: 'customerusers',
        attributes,
        relationships
      },
    };
    if (included.length > 0) body['included'] = included;

    const response = await oroApiCall({
      method: HttpMethod.POST,
      resourceUri: '/customerusers',
      auth: context.auth as OroAuth,
      body,
      headers: p.additionalHeaders as Record<string, string>,
    });

    return response.body;
  },
});
