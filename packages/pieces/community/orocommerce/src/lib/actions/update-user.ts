import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  oroAuth,
  oroApiCall,
  businessUnitDropdown,
  organizationDropdown,
  organizationsDropdown,
  userRoleDropdown,
  userGroupDropdown,
  userAuthStatusDropdown,
  additionalAttributesProp,
  additionalRelationsProp,
  additionalHeadersProp,
} from '../common';
import { OroAuth } from '../common/types';
import { jsonApiBodyUtils } from '../common/jsonapi-body-utils';

export const updateUserAction = createAction({
  auth: oroAuth,
  name: 'update_user',
  displayName: 'Update User',
  description:
    'Updates an existing back-office user in OroCommerce. Only provided fields are changed.',
  props: {
    // -- Target record ---------------------------------------------------------
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'The numeric ID of the user to update.',
      required: true,
    }),

    // -- Attributes ------------------------------------------------------------
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Updated login name for the user.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Updated email address of the user.',
      required: false,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'New password for the account. Must comply with the system security policy.',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    namePrefix: Property.ShortText({
      displayName: 'Name Prefix',
      description: 'Honorific (e.g. Mr., Ms., Dr.).',
      required: false,
    }),
    middleName: Property.ShortText({
      displayName: 'Middle Name',
      required: false,
    }),
    nameSuffix: Property.ShortText({
      displayName: 'Name Suffix',
      description: 'Suffix (e.g. PhD, Jr.).',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Job title or position.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    birthday: Property.ShortText({
      displayName: 'Birthday',
      description: 'Birth date in YYYY-MM-DD format.',
      required: false,
    }),
    enabled: Property.Checkbox({
      displayName: 'Enabled',
      description: 'Enable or disable the user account.',
      required: false,
    }),

    // -- Relationships ---------------------------------------------------------
    owner: businessUnitDropdown,
    organization: organizationDropdown,
    businessUnits: businessUnitDropdown,
    userRoles: userRoleDropdown,
    organizations: organizationsDropdown,
    groups: userGroupDropdown,
    authStatus: userAuthStatusDropdown,

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
        username: p.username,
        email: p.email,
        password: p.password,
        firstName: p.firstName,
        lastName: p.lastName,
        enabled: p.enabled ?? undefined,
        namePrefix: p.namePrefix,
        middleName: p.middleName,
        nameSuffix: p.nameSuffix,
        title: p.title,
        phone: p.phone,
        birthday: p.birthday,
      }),
      ...extraAttrs,
    };

    const relationships = {
      ...jsonApiBodyUtils.buildRels({
        owner: ['businessunits', p.owner],
        organization: ['organizations', p.organization],
        businessUnits: ['businessunits', p.businessUnits, true],
        userRoles: ['userroles', p.userRoles, true],
        organizations: ['organizations', p.organizations, true],
        groups: ['usergroups', p.groups, true],
        auth_status: ['userauthstatuses', p.authStatus],
      }),
      ...extraRels,
    };

    const response = await oroApiCall({
      method: HttpMethod.PATCH,
      resourceUri: `/users/${p.userId}`,
      auth: context.auth as OroAuth,
      body: {
        data: {
          type: 'users',
          id: p.userId,
          attributes,
          relationships,
        },
      },
      headers: p.additionalHeaders as Record<string, string>,
    });

    return response.body;
  },
});

