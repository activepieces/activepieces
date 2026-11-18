import { HttpMethod } from '@activepieces/pieces-common';
import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzApi, ReviewflowzAuthValue } from './client';
import { reviewflowzFormat } from './format';
import { ReviewflowzAccount, ReviewflowzCampaign } from './types';

function campaignOutput(campaign: ReviewflowzCampaign): Record<string, unknown> {
  return {
    ...campaign,
    destinations_summary: (campaign.destinations ?? [])
      .map(
        (destination) =>
          (destination.platform ? reviewflowzFormat.platformName(destination.platform) : destination.source) +
          (destination.goal && destination.goal !== 'most_reviews' && destination.target
            ? ` (until ${destination.target}${destination.goal === 'rating' ? ' rating' : ' 5-star reviews'})`
            : ''),
      )
      .join(', '),
    blockers_summary: (campaign.blockers ?? []).join(' '),
  };
}

async function getCampaign({ auth, id }: { auth: ReviewflowzAuthValue; id: string }): Promise<ReviewflowzCampaign> {
  return reviewflowzApi.call<ReviewflowzCampaign>({ auth, method: HttpMethod.GET, path: `/campaigns/${encodeURIComponent(String(id))}` });
}

async function activate({ auth, id }: { auth: ReviewflowzAuthValue; id: string }): Promise<ReviewflowzCampaign> {
  return reviewflowzApi.call<ReviewflowzCampaign>({ auth, method: HttpMethod.POST, path: `/campaigns/${encodeURIComponent(String(id))}/activate` });
}

function destinationsProp() {
  return Property.DynamicProperties({
    auth: reviewflowzAuth,
    displayName: 'Where reviewers go',
    description: 'The review sites this campaign sends customers to, first choice first.',
    required: false,
    refreshers: [],
    props: async ({ auth }): Promise<DynamicPropsValue> => {
      if (!auth) {
        return {};
      }
      const account = await reviewflowzApi.call<ReviewflowzAccount>({ auth, method: HttpMethod.GET, path: '/account' });
      const goal = Property.StaticDropdown({
        displayName: 'Goal',
        description: 'With a rating or a number to reach, customers go there until it is reached, then to the next destination.',
        required: false,
        defaultValue: 'most_reviews',
        options: {
          options: [
            { label: 'Get as many reviews as possible', value: 'most_reviews' },
            { label: 'Reach a rating', value: 'rating' },
            { label: 'Reach a number of 5-star reviews', value: 'five_star_reviews' },
          ],
        },
      });
      const target = Property.Number({
        displayName: 'Target',
        description: 'The rating (like 4.8) or the number of 5-star reviews (like 50) to reach.',
        required: false,
      });
      if (account.campaign_destinations === 'platform') {
        const page = await reviewflowzApi.call<{ data: { id: string; name: string }[] }>({
          auth,
          method: HttpMethod.GET,
          path: '/platforms',
        });
        return {
          destination_platforms: Property.StaticMultiSelectDropdown({
            displayName: 'Send reviewers to',
            description:
              'Platforms, first choice first. Each customer goes to that platform at their location. Leave empty to keep every platform you have a source on.',
            required: false,
            options: { options: (page.data ?? []).map((platform) => ({ label: platform.name, value: platform.id })) },
          }),
          goal,
          target,
        };
      }
      const sources = await reviewflowzApi.listAll<{ id: string; name?: string; url?: string; platform?: string }>({
        auth,
        path: '/sources',
        max: 1000,
      });
      return {
        destination_sources: Property.StaticMultiSelectDropdown({
          displayName: 'Send reviewers to',
          description: 'Sources, first choice first.',
          required: false,
          options: {
            options: sources.map((source) => ({
              label: `${source.name || source.url} · ${reviewflowzFormat.platformName(source.platform)}`,
              value: source.id,
            })),
          },
        }),
        goal,
        target,
      };
    },
  });
}

function destinationsFrom(values: DynamicPropsValue | undefined): Record<string, unknown>[] | undefined {
  if (!values) {
    return undefined;
  }
  const goal = typeof values['goal'] === 'string' && values['goal'] !== '' ? values['goal'] : 'most_reviews';
  const target =
    values['target'] !== undefined && values['target'] !== null && values['target'] !== ''
      ? Number(values['target'])
      : undefined;
  const withGoal = (row: Record<string, unknown>, index: number) => ({
    ...row,
    ...(index === 0 && goal !== 'most_reviews' ? { goal, target } : {}),
  });
  const platforms = asList(values['destination_platforms']);
  if (platforms.length > 0) {
    return platforms.map((platform, index) => withGoal({ platform }, index));
  }
  const sources = asList(values['destination_sources']);
  if (sources.length > 0) {
    return sources.map((source, index) => withGoal({ source }, index));
  }
  return undefined;
}

function messageProps() {
  return {
    subject: Property.ShortText({
      displayName: 'Email subject',
      description: 'Emails only. Leave empty to keep ours ("Did you love your experience with ...?").',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Message',
      description: 'Leave empty to keep ours. Merge fields: {{first_name}}, {{location_name}}, and your contact fields by name.',
      required: false,
    }),
    cta_text: Property.ShortText({
      displayName: 'Button text',
      description: 'Emails only, like "Leave a review".',
      required: false,
    }),
  };
}

function messageFrom(values: {
  subject?: string;
  body?: string;
  cta_text?: string;
}): Record<string, string> | undefined {
  const message = Object.fromEntries(
    (['subject', 'body', 'cta_text'] as const)
      .map((key) => [key, values[key]] as const)
      .filter((entry): entry is readonly ['subject' | 'body' | 'cta_text', string] => Boolean(entry[1])),
  );
  return Object.keys(message).length > 0 ? message : undefined;
}

function delayMinutes(hours: number | undefined | null): number | undefined {
  return hours === undefined || hours === null ? undefined : Math.round(Number(hours) * 60);
}

function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

const CHANNEL_OPTIONS = [
  { label: 'Email', value: 'email' },
  { label: 'Text message', value: 'sms' },
  { label: 'WhatsApp', value: 'whatsapp' },
];

export const reviewflowzCampaigns = {
  campaignOutput,
  getCampaign,
  activate,
  destinationsProp,
  destinationsFrom,
  messageProps,
  messageFrom,
  delayMinutes,
  CHANNEL_OPTIONS,
};
