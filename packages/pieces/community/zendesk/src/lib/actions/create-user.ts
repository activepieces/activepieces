import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../index';
import { makeZendeskRequest, validateZendeskAuth, ZENDESK_ERRORS } from '../common/utils';
import { ZendeskAuthProps, ZendeskUser } from '../common/types';
import { sampleUser } from '../common/sample-data';

export const createUser = createAction({
  auth: zendeskAuth,
  name: 'create_user',
  displayName: 'Create User',
  description: 'Create a new user in Zendesk',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the user',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the user',
      required: true,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'The role of the user',
      required: false,
      defaultValue: 'end-user',
      options: {
        placeholder: 'Select user role',
        options: [
          { label: 'End User', value: 'end-user' },
          { label: 'Agent', value: 'agent' },
          { label: 'Admin', value: 'admin' },
        ],
      },
    }),
    organization_id: Property.Number({
      displayName: 'Organization ID',
      description: 'The ID of the organization this user belongs to',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'A unique external identifier for the user',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'The phone number of the user',
      required: false,
    }),
    time_zone: Property.ShortText({
      displayName: 'Time Zone',
      description: 'The time zone of the user (e.g., America/New_York)',
      required: false,
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description: 'The locale of the user (e.g., en-US)',
      required: false,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Details about the user',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Internal notes about the user',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma-separated list of tags to add to the user',
      required: false,
    }),
    verified: Property.Checkbox({
      displayName: 'Verified',
      description: 'Whether the user is verified',
      required: false,
      defaultValue: false,
    }),
  },
  sampleData: sampleUser,
  async run(context) {
    const { auth, propsValue } = context;

    if (!validateZendeskAuth(auth)) {
      throw new Error(ZENDESK_ERRORS.INVALID_AUTH);
    }

    const authentication = auth as ZendeskAuthProps;
    
    // Process tags
    const tags = propsValue.tags ? 
      propsValue.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : 
      [];

    const userData = {
      user: {
        name: propsValue.name,
        email: propsValue.email,
        role: propsValue.role || 'end-user',
        ...(propsValue.organization_id && { organization_id: propsValue.organization_id }),
        ...(propsValue.external_id && { external_id: propsValue.external_id }),
        ...(propsValue.phone && { phone: propsValue.phone }),
        ...(propsValue.time_zone && { time_zone: propsValue.time_zone }),
        ...(propsValue.locale && { locale: propsValue.locale }),
        ...(propsValue.details && { details: propsValue.details }),
        ...(propsValue.notes && { notes: propsValue.notes }),
        ...(tags.length > 0 && { tags }),
        verified: propsValue.verified === true,
      },
    };

    try {
      const response = await makeZendeskRequest<{ user: ZendeskUser }>(
        authentication,
        '/users.json',
        HttpMethod.POST,
        userData
      );

      return response.user;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error(ZENDESK_ERRORS.UNAUTHORIZED);
      } else if (error.response?.status === 404) {
        throw new Error(ZENDESK_ERRORS.NOT_FOUND);
      } else if (error.response?.status === 422) {
        // Check for specific Zendesk validation errors
        if (error.response?.data?.error === 'DuplicateValue') {
          throw new Error('A user with this email already exists');
        }
        throw new Error('Invalid user data provided');
      } else if (error.response?.status === 429) {
        throw new Error(ZENDESK_ERRORS.RATE_LIMITED);
      } else if (error.response?.status >= 500) {
        throw new Error(ZENDESK_ERRORS.SERVER_ERROR);
      }
      
      throw new Error(`Failed to create user: ${error.message}`);
    }
  },
});