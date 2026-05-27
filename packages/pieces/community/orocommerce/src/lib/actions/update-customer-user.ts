import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  oroAuth,
  oroApiCall,
  customerDropdown,
  customerUserRoleDropdown,
  organizationDropdown,
  userDropdown,
  websiteDropdown,
  additionalAttributesProp,
  additionalRelationsProp,
} from '../common';
import { OroAuth } from '../common/types';
import { jsonApiBodyUtils } from '../common/jsonapi-body-utils';

export const updateCustomerUserAction = createAction({
  auth: oroAuth,
  name: 'update_customer_user',
  displayName: 'Update Customer User',
  description:
    'Updates an existing customer user (storefront account) in OroCommerce. Only provided fields are changed.',
  props: {
    // -- Target record ---------------------------------------------------------
    customerUserId: Property.ShortText({
      displayName: 'Customer User ID',
      description: 'The numeric ID of the customer user to update.',
      required: true,
    }),

    // -- Attributes ------------------------------------------------------------
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Updated email address of the customer user.',
      required: false,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'New password for the account. Must comply with the system security policy.',
      required: false,
    }),

    namePrefix: Property.ShortText({
      displayName: 'Name Prefix',
      description: 'Honorific (e.g. Mr., Ms., Dr.).',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    middleName: Property.ShortText({
      displayName: 'Middle Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    nameSuffix: Property.ShortText({
      displayName: 'Name Suffix',
      description: 'Suffix (e.g. PhD, Jr.).',
      required: false,
    }),

    enabled: Property.Checkbox({
      displayName: 'Enabled',
      description: 'Enable or disable the storefront account.',
      required: false,
    }),
    confirmed: Property.Checkbox({
      displayName: 'Confirmed',
      description: 'Whether the user has completed email confirmation.',
      required: false,
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

    // -- Relationships ---------------------------------------------------------
    customer: customerDropdown,
    website: websiteDropdown,
    userRoles: customerUserRoleDropdown,
    owner: userDropdown,
    organization: organizationDropdown,
    additionalAttributes: additionalAttributesProp,
    additionalRelations: additionalRelationsProp,
  },

  async run(context) {
    const p = context.propsValue;

    const extraAttrs = jsonApiBodyUtils.parseAdditionalAttributes(p.additionalAttributes);
    const extraRels = jsonApiBodyUtils.parseAdditionalRelations(p.additionalRelations);

    const attributes = {
      ...jsonApiBodyUtils.pickDefined({
        email: p.email,
        firstName: p.firstName,
        lastName: p.lastName,
        password: p.password,
        enabled: p.enabled ?? undefined,
        confirmed: p.confirmed ?? undefined,
        namePrefix: p.namePrefix,
        middleName: p.middleName,
        nameSuffix: p.nameSuffix,
        birthday: p.birthday,
        externalId: p.externalId,
      }),
      ...extraAttrs,
    };

    const relationships = {
      ...jsonApiBodyUtils.buildRels({
        customer: ['customers', p.customer],
        website: ['websites', p.website],
        userRoles: ['customeruserroles', p.userRoles, true],
        owner: ['users', p.owner],
        organization: ['organizations', p.organization],
      }),
      ...extraRels,
    };

    const response = await oroApiCall({
      method: HttpMethod.PATCH,
      resourceUri: `/customerusers/${p.customerUserId}`,
      auth: context.auth as OroAuth,
      body: {
        data: {
          type: 'customerusers',
          id: p.customerUserId,
          attributes,
          relationships,
        },
      },
    });

    return response.body;
  },
});
