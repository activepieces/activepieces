import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../index';
import { makeZendeskRequest, validateZendeskAuth, ZENDESK_ERRORS } from '../common/utils';
import { ZendeskAuthProps, ZendeskOrganization } from '../common/types';
import { sampleOrganization } from '../common/sample-data';

export const updateOrganization = createAction({
  auth: zendeskAuth,
  name: 'update_organization',
  displayName: 'Update Organization',
  description: 'Update an existing organization in Zendesk',
  props: {
    organization_id: Property.Number({
      displayName: 'Organization ID',
      description: 'The ID of the organization to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Update the name of the organization',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'Update the external identifier for the organization',
      required: false,
    }),
    domain_names: Property.ShortText({
      displayName: 'Domain Names',
      description: 'Comma-separated list of domain names to replace existing ones',
      required: false,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Update description or details about the organization',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Update internal notes about the organization',
      required: false,
    }),
    group_id: Property.Number({
      displayName: 'Group ID',
      description: 'Update the ID of the group associated with this organization',
      required: false,
    }),
    shared_tickets: Property.Checkbox({
      displayName: 'Shared Tickets',
      description: 'Whether end users in this organization can see each other\'s tickets',
      required: false,
    }),
    shared_comments: Property.Checkbox({
      displayName: 'Shared Comments',
      description: 'Whether end users in this organization can see each other\'s comments',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma-separated list of tags to replace existing tags',
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
    
    // Build update data object with only provided fields
    const updateData: any = {
      organization: {},
    };

    if (propsValue.name) updateData.organization.name = propsValue.name;
    if (propsValue.external_id) updateData.organization.external_id = propsValue.external_id;
    if (propsValue.details) updateData.organization.details = propsValue.details;
    if (propsValue.notes) updateData.organization.notes = propsValue.notes;
    if (propsValue.group_id) updateData.organization.group_id = propsValue.group_id;
    
    // Handle boolean values explicitly
    if (propsValue.shared_tickets !== undefined) {
      updateData.organization.shared_tickets = propsValue.shared_tickets;
    }
    if (propsValue.shared_comments !== undefined) {
      updateData.organization.shared_comments = propsValue.shared_comments;
    }

    // Process domain names
    if (propsValue.domain_names) {
      const domainNames = propsValue.domain_names
        .split(',')
        .map(domain => domain.trim())
        .filter(domain => domain.length > 0);
      if (domainNames.length > 0) {
        updateData.organization.domain_names = domainNames;
      }
    }
    
    // Process tags
    if (propsValue.tags) {
      const tags = propsValue.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      if (tags.length > 0) {
        updateData.organization.tags = tags;
      }
    }

    // Check if we have anything to update
    if (Object.keys(updateData.organization).length === 0) {
      throw new Error('No fields provided to update');
    }

    try {
      const response = await makeZendeskRequest<{ organization: ZendeskOrganization }>(
        authentication,
        `/organizations/${propsValue.organization_id}.json`,
        HttpMethod.PUT,
        updateData
      );

      return response.organization;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error(ZENDESK_ERRORS.UNAUTHORIZED);
      } else if (error.response?.status === 404) {
        throw new Error('Organization not found');
      } else if (error.response?.status === 422) {
        throw new Error('Invalid organization data provided');
      } else if (error.response?.status === 429) {
        throw new Error(ZENDESK_ERRORS.RATE_LIMITED);
      } else if (error.response?.status >= 500) {
        throw new Error(ZENDESK_ERRORS.SERVER_ERROR);
      }
      
      throw new Error(`Failed to update organization: ${error.message}`);
    }
  },
});