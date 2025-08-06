import {
  TriggerStrategy,
  createTrigger,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../../index';
import { ZendeskAuthProps, ZendeskAuditEvent } from '../common/types';
import { sampleAuditEvent } from '../common/sample-data';

export const tagAddedToTicket = createTrigger({
  auth: zendeskAuth,
  name: 'tag_added_to_ticket',
  displayName: 'Tag Added to Ticket',
  description: 'Fires when a tag is added to a ticket',
  type: TriggerStrategy.POLLING,
  props: {
    tag_name: Property.ShortText({
      displayName: 'Specific Tag (Optional)',
      description: 'Monitor for a specific tag. Leave empty to monitor all tag additions.',
      required: false,
    }),
  },
  sampleData: sampleAuditEvent,
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});

const polling: Polling<ZendeskAuthProps, { tag_name?: string }> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const auditEvents = await getTagAdditionEvents(auth, propsValue.tag_name);
    return auditEvents.map((event) => ({
      id: event.id,
      data: event,
    }));
  },
};

async function getTagAdditionEvents(authentication: ZendeskAuthProps, specificTag?: string) {
  const { email, token, subdomain } = authentication;
  
  // Get recent ticket audits to find tag change events
  const url = `https://${subdomain}.zendesk.com/api/v2/ticket_audits.json?per_page=100`;

  const response = await httpClient.sendRequest<{ audits: ZendeskAuditEvent[] }>({
    url,
    method: HttpMethod.GET,
    authentication: {
      type: AuthenticationType.BASIC,
      username: email + '/token',
      password: token,
    },
  });
  
  // Filter for audits that contain tag change events
  const tagAdditionEvents = response.body.audits.filter(audit => {
    return audit.events.some(event => {
      if (event.type === 'Change' && event.field_name === 'tags') {
        // Check if tags were added (value contains more tags than previous_value)
        const previousTags = Array.isArray(event.previous_value) ? event.previous_value : [];
        const currentTags = Array.isArray(event.value) ? event.value : [];
        
        // Find newly added tags
        const addedTags = currentTags.filter((tag: string) => !previousTags.includes(tag));
        
        // If monitoring a specific tag, check if it was added
        if (specificTag) {
          return addedTags.includes(specificTag);
        }
        
        // Otherwise, return true if any tags were added
        return addedTags.length > 0;
      }
      return false;
    });
  });
  
  return tagAdditionEvents;
}