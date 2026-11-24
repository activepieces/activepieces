import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { firstTouchAuth } from '../auth';
import { firstTouchClient } from '../common/client';
import { firstTouchPolling, PolledEvent } from '../common/polling';
import { firstTouchProps } from '../common/props';
import { readUtils } from '../common/read';

export const newLinkedinReplyTrigger = createTrigger({
  auth: firstTouchAuth,
  name: 'new_linkedin_reply',
  classification: 'READ',
  displayName: 'New LinkedIn Reply',
  description: 'Triggers when a prospect replies on LinkedIn in any conversation in the FirstTouch inbox.',
  aiMetadata: {
    description:
      'Fires once for each new inbound LinkedIn message in the FirstTouch Unibox, across every LinkedIn account the API key can see (or one account if chosen). Each payload is one conversation with its latest inbound message time and preview.',
  },
  props: {
    tag: Property.StaticDropdown({
      displayName: 'Only Conversations Tagged',
      description: 'Leave empty for every conversation.',
      required: false,
      options: {
        options: [
          { label: 'Hot', value: 'hot' },
          { label: 'Nurture', value: 'nurture' },
        ],
      },
    }),
    linkedin_account: firstTouchProps.linkedinAccountDropdown({
      description: "Only replies to this teammate's LinkedIn account. Leave empty for every account you can access.",
    }),
  },
  sampleData: {
    conversation_id: 'linkedin_unibox_conversation_8ee4c408252f4dd683d0c5537d6e18cf',
    linkedin_account_id: 'lin_account_e8ab189f4baa42e6ac38e9830d379c54',
    participant_name: 'Jane Doe',
    participant_linkedin_url: 'https://www.linkedin.com/in/jane-doe',
    company_name: 'Acme',
    company_domain: 'acme.com',
    latest_message_preview: 'Thanks for reaching out, happy to chat next week.',
    latest_message_at: '2026-11-24T03:29:23.72Z',
    last_inbound_message_at: '2026-11-24T03:29:23.72Z',
    reply_is_latest_message: true,
    is_unread: true,
    tags: 'hot',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await firstTouchPolling.enable({
      store: context.store,
      isRepublish: context.isRepublish,
      fetchEvents: () => fetchReplies({ apiKey: context.auth.secret_text, tag: context.propsValue.tag, linAccountId: context.propsValue.linkedin_account }),
    });
  },
  async onDisable(context) {
    await firstTouchPolling.disable({ store: context.store });
  },
  async test(context) {
    return firstTouchPolling.test({
      fetchEvents: () => fetchReplies({ apiKey: context.auth.secret_text, tag: context.propsValue.tag, linAccountId: context.propsValue.linkedin_account }),
    });
  },
  async run(context) {
    return firstTouchPolling.poll({
      store: context.store,
      fetchEvents: () => fetchReplies({ apiKey: context.auth.secret_text, tag: context.propsValue.tag, linAccountId: context.propsValue.linkedin_account }),
    });
  },
});

async function fetchReplies({
  apiKey,
  tag,
  linAccountId,
}: {
  apiKey: string;
  tag: string | undefined;
  linAccountId: string | undefined;
}): Promise<PolledEvent[]> {
  const response = await firstTouchClient.callTool({
    apiKey,
    tool: 'list_linkedin_unibox_conversations',
    body: {
      limit: 100,
      archived: false,
      tags: tag ? [tag] : undefined,
      linAccountId: linAccountId || undefined,
    },
  });
  return readUtils
    .records(response['conversations'])
    .filter((conversation) => readUtils.text(conversation['lastInboundMessageAtUtc']))
    .map((conversation) => {
      const inboundAt = readUtils.text(conversation['lastInboundMessageAtUtc']) ?? '';
      const latestAt = readUtils.text(conversation['latestMessageAtUtc']);
      const tags = Array.isArray(conversation['tags']) ? conversation['tags'].map(String).join(', ') : '';
      return {
        id: `${readUtils.text(conversation['conversationId'])}:${inboundAt}`,
        occurredAt: inboundAt,
        data: {
          conversation_id: readUtils.text(conversation['conversationId']),
          linkedin_account_id: readUtils.text(conversation['linAccountId']),
          participant_name: readUtils.text(conversation['participantName']),
          participant_linkedin_url: readUtils.text(conversation['participantLinkedinUrl']),
          company_name: readUtils.text(conversation['companyName']),
          company_domain: readUtils.text(conversation['companyDomain']),
          latest_message_preview: readUtils.text(conversation['latestMessagePreview']),
          latest_message_at: latestAt,
          last_inbound_message_at: inboundAt,
          reply_is_latest_message: latestAt === inboundAt,
          is_unread: conversation['isUnread'] === true,
          tags,
        },
      };
    });
}
