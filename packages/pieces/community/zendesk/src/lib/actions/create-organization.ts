import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../index';
import { makeZendeskRequest, validateZendeskAuth, ZENDESK_ERRORS } from '../common/utils';
import { ZendeskAuthProps, ZendeskOrganization } from '../common/types';
import { sampleOrganization } from '../common/sample-data';

export const createOrganization = createAction({
  auth: zendeskAuth,
  name: 'create_organization',
  displayName: 'Create Organization',
  description: 'Create a new organization in Zendesk',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the organization',
      required: true,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'A unique external identifier for the organization',
      required: false,
    }),
    domain_names: Property.ShortText({
      displayName: 'Domain Names',
      description: 'Comma-separated list of domain names associated with this organization',
      required: false,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Description or details about the organization',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Internal notes about the organization',
      required: false,
    }),
    group_id: Property.Number({
      displayName: 'Group ID',
      description: 'The ID of the group associated with this organization',
      required: false,
    }),
    shared_tickets: Property.Checkbox({
      displayName: 'Shared Tickets',
      description: 'Whether end users in this organization can see each other\'s tickets',
      required: false,
      defaultValue: false,
    }),
    shared_comments: Property.Checkbox({
      displayName: 'Shared Comments',
      description: 'Whether end users in this organization can see each other\'s comments',
      required: false,
      defaultValue: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma-separated list of tags to add to the organization',
      required: false,
    }),
  },
  sampleData: sampleOrganization,
  async run(context) {
    const { auth, propsValue } = context;

    if (!validateZendeskAuth(auth)) {
      throw new Error(ZENDESK_ERRORS.INVALID_AUTH);
    }

    const authentication = auth as ZendeskAuthProps;
    
    // Process domain names
    const domainNames = propsValue.domain_names ? 
      propsValue.domain_names.split(',').map(domain => domain.trim()).filter(domain => domain.length > 0) : 
      [];

    // Process tags
    const tags = propsValue.tags ? 
      propsValue.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : 
      [];

    const organizationData = {
      organization: {
        name: propsValue.name,
        ...(propsValue.external_id && { external_id: propsValue.external_id }),
        ...(domainNames.length > 0 && { domain_names: domainNames }),
        ...(propsValue.details && { details: propsValue.details }),
        ...(propsValue.notes && { notes: propsValue.notes }),
        ...(propsValue.group_id && { group_id: propsValue.group_id }),
        shared_tickets: propsValue.shared_tickets === true,
        shared_comments: propsValue.shared_comments === true,
        ...(tags.length > 0 && { tags }),
      },
    };

    try {
      const response = await makeZendeskRequest<{ organization: ZendeskOrganization }>(
        authentication,
        '/organizations.json',
        HttpMethod.POST,
        organizationData
      );

      return response.organization;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error(ZENDESK_ERRORS.UNAUTHORIZED);
      } else if (error.response?.status === 404) {
        throw new Error(ZENDESK_ERRORS.NOT_FOUND);
      } else if (error.response?.status === 422) {
        throw new Error('Invalid organization data provided');
      } else if (error.response?.status === 429) {
        throw new Error(ZENDESK_ERRORS.RATE_LIMITED);
      } else if (error.response?.status >= 500) {
        throw new Error(ZENDESK_ERRORS.SERVER_ERROR);
      }
      
      throw new Error(`Failed to create organization: ${error.message}`);
    }
  },
});