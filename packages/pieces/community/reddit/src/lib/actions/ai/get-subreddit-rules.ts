import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditGetSubredditRulesOutputSchema } from '../../output-schemas';

export const redditGetSubredditRules = createAction({
  auth: redditAuth,
  name: 'reddit_get_subreddit_rules',
  outputSchema: redditGetSubredditRulesOutputSchema,
  displayName: 'Get Subreddit Rules',
  description: 'Gets a subreddit\'s posting rules.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns a subreddit\'s rules in priority order (short name, description, and whether each applies to posts, comments or both), plus Reddit\'s site-wide rules. Check before posting or commenting; rule short names are also valid report reasons.',
    idempotent: true,
  },
  props: {
    subreddit: redditAiProps.subreddit({ required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await redditApi.request<RulesResponse>({
      auth,
      method: HttpMethod.GET,
      path: `/r/${redditApi.cleanSubreddit({ value: propsValue.subreddit })}/about/rules`,
    });
    const rules = (response.rules ?? []).map((rule) => ({
      short_name: rule.short_name ?? null,
      description: rule.description ?? null,
      kind: rule.kind ?? null,
      priority: rule.priority ?? null,
      violation_reason: rule.violation_reason ?? null,
      created_utc: rule.created_utc ?? null,
    }));
    return { rules, count: rules.length, site_rules: response.site_rules ?? [] };
  },
});

type RulesResponse = {
  rules?: {
    short_name?: string;
    description?: string;
    kind?: string;
    priority?: number;
    violation_reason?: string;
    created_utc?: number;
  }[];
  site_rules?: string[];
};
