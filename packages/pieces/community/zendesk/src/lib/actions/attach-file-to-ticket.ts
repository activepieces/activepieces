import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';
import { ticketIdDropdown } from '../common/props';

export const attachFileToTicketAction = createAction({
  auth: zendeskAuth,
  name: 'attach-file-to-ticket',
  displayName: 'Attach File to Ticket',
  description: 'Attach a file to a ticket.',
  audience: 'both',
  aiMetadata: { description: 'Attaches a file to an existing ticket. File must be provided as a file object (from file upload or previous action output). The attachment becomes visible in the ticket timeline and is available to agents and end-users.', idempotent: false },
  props: {
    ticket_id: ticketIdDropdown,
    file: Property.File({
      displayName: 'File',
      description: 'The file to attach to the ticket',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const authentication = auth;
    const { ticket_id, file } = propsValue;

    if (!file) {
      throw new Error('File is required');
    }

    try {
      // First, upload the file to get a token
      const uploadResponse = await httpClient.sendRequest<{
        upload: { token: string };
      }>({
        url: `https://${authentication.props.subdomain}.zendesk.com/api/v2/uploads.json?filename=${encodeURIComponent(file.filename)}`,
        method: HttpMethod.POST,
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.props.email + '/token',
          password: authentication.props.token,
        },
        body: file.data,
      });

      const uploadToken = uploadResponse.body.upload.token;

      // Then attach the uploaded file to the ticket
      const attachResponse = await httpClient.sendRequest({
        url: `https://${authentication.props.subdomain}.zendesk.com/api/v2/tickets/${ticket_id}.json`,
        method: HttpMethod.PUT,
        headers: {
          'Content-Type': 'application/json',
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.props.email + '/token',
          password: authentication.props.token,
        },
        body: {
          ticket: {
            comment: {
              body: `File attached: ${file.filename}`,
              uploads: [uploadToken],
            },
          },
        },
      });

      return {
        success: true,
        message: `Successfully attached file "${file.filename}" to ticket ${ticket_id}`,
        data: attachResponse.body,
        file_name: file.filename,
        upload_token: uploadToken,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('400')) {
        throw new Error(
          'Invalid request parameters. Please check your input values and try again.'
        );
      }

      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        throw new Error(
          'Authentication failed. Please check your API credentials and permissions.'
        );
      }

      if (errorMessage.includes('404')) {
        throw new Error(
          `Ticket with ID ${ticket_id} not found. Please verify the ticket ID.`
        );
      }

      if (errorMessage.includes('413')) {
        throw new Error('File is too large. Please try a smaller file.');
      }

      if (errorMessage.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to attach file to ticket: ${errorMessage}`);
    }
  },
});
