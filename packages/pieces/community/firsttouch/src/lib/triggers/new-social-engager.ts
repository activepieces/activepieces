import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { firstTouchAuth } from '../auth';
import { firstTouchClient } from '../common/client';
import { firstTouchPolling, PolledEvent } from '../common/polling';
import { firstTouchProps } from '../common/props';
import { readUtils } from '../common/read';

export const newSocialEngagerTrigger = createTrigger({
  auth: firstTouchAuth,
  name: 'new_social_engager',
  classification: 'READ',
  displayName: 'New Social Engager',
  description: 'Triggers when someone reacts to or comments on a LinkedIn profile or page monitored by a FirstTouch signal.',
  aiMetadata: {
    description:
      'Fires once for each new person who reacted to or commented on a post from a profile or page monitored by the chosen FirstTouch Social Engagement signal. Each payload is one engager with their title, company, email when known, and the post they engaged with.',
  },
  props: {
    signal: firstTouchProps.signalDropdown({
      description: 'The FirstTouch Social Engagement signal to watch.',
    }),
    engagement_type: Property.StaticDropdown({
      displayName: 'Engagement Type',
      description: 'Leave empty for reactions and comments.',
      required: false,
      options: {
        options: [
          { label: 'Comments', value: 'comment' },
          { label: 'Reactions', value: 'reaction' },
        ],
      },
    }),
  },
  sampleData: {
    id: 'lin_engagement_2a3d1b248cf8428c80b1af1b93b4fa83',
    engagement_type: 'REACTION',
    reaction_type: 'LIKE',
    engaged_at: '2026-11-24T14:42:40.943Z',
    first_name: 'Jane',
    last_name: 'Doe',
    linkedin_url: 'https://www.linkedin.com/in/jane-doe',
    title: 'VP Sales',
    company: 'Acme',
    company_website: 'https://acme.com',
    email: 'jane@acme.com',
    comment: null,
    post_url: 'https://www.linkedin.com/feed/update/urn:li:activity:7528116565934931969/',
    post_text: 'Three things we changed in our outbound this quarter...',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await firstTouchPolling.enable({
      store: context.store,
      isRepublish: context.isRepublish,
      fetchEvents: () =>
        fetchEngagers({ apiKey: context.auth.secret_text, signalId: context.propsValue.signal, engagementType: context.propsValue.engagement_type }),
    });
  },
  async onDisable(context) {
    await firstTouchPolling.disable({ store: context.store });
  },
  async test(context) {
    return firstTouchPolling.test({
      fetchEvents: () =>
        fetchEngagers({ apiKey: context.auth.secret_text, signalId: context.propsValue.signal, engagementType: context.propsValue.engagement_type }),
    });
  },
  async run(context) {
    return firstTouchPolling.poll({
      store: context.store,
      fetchEvents: () =>
        fetchEngagers({ apiKey: context.auth.secret_text, signalId: context.propsValue.signal, engagementType: context.propsValue.engagement_type }),
    });
  },
});

async function fetchEngagers({
  apiKey,
  signalId,
  engagementType,
}: {
  apiKey: string;
  signalId: string;
  engagementType: string | undefined;
}): Promise<PolledEvent[]> {
  const response = await firstTouchClient.callTool({
    apiKey,
    tool: 'list_social_engagement_engagers',
    body: {
      signalId,
      engagementType: engagementType || undefined,
      engagedFromUtc: firstTouchPolling.daysAgoIso(7),
      limit: 100,
    },
  });
  return readUtils.records(readUtils.record(response['engagers'])['items']).map((engager) => {
    const engagedAt = readUtils.text(engager['engaged_at']) ?? '';
    return {
      id: readUtils.text(engager['id']) ?? `${readUtils.text(engager['profile_url'])}:${engagedAt}`,
      occurredAt: engagedAt,
      data: {
        id: readUtils.text(engager['id']),
        engagement_type: readUtils.text(engager['engagement_type']),
        reaction_type: readUtils.text(engager['reaction_type']),
        engaged_at: engagedAt,
        first_name: readUtils.text(engager['first_name']),
        last_name: readUtils.text(engager['last_name']),
        linkedin_url: readUtils.text(engager['profile_url']),
        title: readUtils.text(engager['title']),
        company: readUtils.text(engager['company']),
        company_website: readUtils.text(engager['company_website']),
        email: readUtils.text(engager['email']),
        comment: readUtils.text(engager['content']),
        post_url: readUtils.text(engager['post_url']),
        post_text: readUtils.text(engager['post_text']),
      },
    };
  });
}
