import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { gorgiasAuth } from '../../';
import { gorgiasApi } from './client';

const NOT_CONNECTED = {
  disabled: true,
  options: [],
  placeholder: 'Please connect your Gorgias account first',
};

const ticketId = (required: boolean) =>
  Property.Dropdown({
    displayName: 'Ticket',
    description: 'Pick the ticket from your 100 most recently updated tickets.',
    auth: gorgiasAuth,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return NOT_CONNECTED;
      }
      const response = await gorgiasApi.call<{
        data: { id: number; subject: string | null; status: string }[];
      }>({
        auth: auth.props,
        method: HttpMethod.GET,
        path: '/tickets',
        queryParams: { limit: '100', order_by: 'updated_datetime:desc' },
      });
      return {
        disabled: false,
        options: response.body.data.map((ticket) => ({
          label: `#${ticket.id} - ${ticket.subject ?? '(no subject)'} (${ticket.status})`,
          value: ticket.id,
        })),
      };
    },
  });

const assigneeUserId = (required: boolean) =>
  Property.Dropdown({
    displayName: 'Assignee',
    description: 'The agent to assign the ticket to.',
    auth: gorgiasAuth,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return NOT_CONNECTED;
      }
      const response = await gorgiasApi.call<{
        data: { id: number; name: string | null; email: string }[];
      }>({
        auth: auth.props,
        method: HttpMethod.GET,
        path: '/users',
        queryParams: { limit: '100' },
      });
      return {
        disabled: false,
        options: response.body.data.map((user) => ({
          label: user.name ? `${user.name} (${user.email})` : user.email,
          value: user.id,
        })),
      };
    },
  });

const tagNames = Property.MultiSelectDropdown({
  displayName: 'Tags',
  description: 'Select existing tags to apply.',
  auth: gorgiasAuth,
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return NOT_CONNECTED;
    }
    const response = await gorgiasApi.call<{
      data: { id: number; name: string }[];
    }>({
      auth: auth.props,
      method: HttpMethod.GET,
      path: '/tags',
      queryParams: { limit: '100' },
    });
    return {
      disabled: false,
      options: response.body.data.map((tag) => ({
        label: tag.name,
        value: tag.name,
      })),
    };
  },
});

export const gorgiasProps = { ticketId, assigneeUserId, tagNames };
