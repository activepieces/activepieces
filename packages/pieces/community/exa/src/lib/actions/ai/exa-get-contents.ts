import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { exaAuth } from '../../auth';
import { exaApi, exaInput } from '../../common/client';
import { ExaCost, ExaResult, ExaStatus, exaResults } from '../../common/results';
import { exaGetContentsOutputSchema } from '../../output-schemas-ai';

export const exaGetContentsAction = createAction({
  name: 'exa_get_contents',
  classification: 'READ',
  displayName: 'Get Page Contents',
  description: 'Fetches clean content for known URLs and reports which URLs failed.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches clean page text, and optionally highlights, a question-guided summary, outgoing links and matching subpages, for URLs you already have, and reports a per-URL status so failed fetches are visible (the call still succeeds when some URLs fail). Use after exa_search or when given URLs; use exa_search to discover pages. Billed $0.001 per page per content type. Read-only and idempotent.',
    idempotent: true,
  },
  auth: exaAuth,
  outputSchema: exaGetContentsOutputSchema,
  props: {
    urls: Property.Array({
      displayName: 'URLs',
      description: 'Full URLs to fetch, including https://, e.g. "https://exa.ai/docs". Up to 100.',
      required: true,
    }),
    includeText: Property.Checkbox({
      displayName: 'Include Page Text',
      description: 'Return the page text.',
      required: false,
      defaultValue: true,
    }),
    textMaxCharacters: Property.Number({
      displayName: 'Max Text Characters',
      description: 'Cap the text per page, e.g. 5000. Only used when page text is included.',
      required: false,
    }),
    includeHighlights: Property.Checkbox({
      displayName: 'Include Highlights',
      description: 'Return the most relevant snippets from each page.',
      required: false,
      defaultValue: false,
    }),
    highlightsQuery: Property.ShortText({
      displayName: 'Highlights Focus',
      description: 'Optional question that steers which snippets are picked. Turns highlights on.',
      required: false,
    }),
    summaryQuery: Property.ShortText({
      displayName: 'Summary Question',
      description: 'Return a per-page AI summary focused on this question, e.g. "Who are the founders?".',
      required: false,
    }),
    maxAgeHours: Property.Number({
      displayName: 'Max Content Age (hours)',
      description: 'Use cached content only if newer than this many hours; 0 always fetches fresh, -1 always uses cache, max 720.',
      required: false,
    }),
    subpages: Property.Number({
      displayName: 'Subpages',
      description: 'Also fetch up to this many linked subpages per URL, e.g. 3.',
      required: false,
    }),
    subpageTarget: Property.ShortText({
      displayName: 'Subpage Keyword',
      description: 'Prefer subpages matching this keyword, e.g. "pricing" or "about".',
      required: false,
    }),
    linksPerPage: Property.Number({
      displayName: 'Links per Page',
      description: 'Also return up to this many links found on each page.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const listed = exaInput.stringList(props.urls);
    const urls = listed ? [...new Set(listed)] : undefined;
    if (!urls) {
      throw new Error('Provide at least one URL.');
    }
    if (urls.length > MAX_URLS) {
      throw new Error(`Provide at most ${MAX_URLS} URLs per call; ${urls.length} were given.`);
    }
    const textMaxCharacters = exaInput.optionalInteger({ value: props.textMaxCharacters, name: 'Max Text Characters', min: 1, max: 1000000 });
    const maxAgeHours = exaInput.optionalInteger({ value: props.maxAgeHours, name: 'Max Content Age (hours)', min: -1, max: 720 });
    const subpages = exaInput.optionalInteger({ value: props.subpages, name: 'Subpages', min: 1, max: 100 });
    const linksPerPage = exaInput.optionalInteger({ value: props.linksPerPage, name: 'Links per Page', min: 1, max: 1000 });
    const highlightsQuery = exaInput.optionalText(props.highlightsQuery);
    const summaryQuery = exaInput.optionalText(props.summaryQuery);
    const subpageTarget = exaInput.optionalText(props.subpageTarget);
    const includeText = props.includeText !== false;
    if (!includeText && !highlightsQuery && !props.includeHighlights && !summaryQuery && linksPerPage === undefined) {
      throw new Error('Choose at least one thing to return: page text, highlights, a summary question or links per page.');
    }

    const response = await exaApi.call<{ results?: ExaResult[]; statuses?: ExaStatus[]; costDollars?: ExaCost }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/contents',
      body: {
        urls,
        text: includeText
          ? textMaxCharacters !== undefined
            ? { maxCharacters: textMaxCharacters }
            : true
          : false,
        ...(highlightsQuery
          ? { highlights: { query: highlightsQuery } }
          : props.includeHighlights
            ? { highlights: true }
            : {}),
        ...(summaryQuery ? { summary: { query: summaryQuery } } : {}),
        ...(maxAgeHours !== undefined ? { maxAgeHours } : {}),
        ...(subpages !== undefined ? { subpages } : {}),
        ...(subpageTarget ? { subpageTarget } : {}),
        ...(linksPerPage !== undefined ? { extras: { links: linksPerPage } } : {}),
      },
    });
    const statuses = (response.statuses ?? []).map(exaResults.flattenStatus);
    const results = (response.results ?? []).map(exaResults.flattenPage);
    const fetched = new Set(
      statuses.length > 0
        ? statuses.filter((status) => status.status === 'success').map((status) => status.url)
        : results.flatMap((result) => [result.id, result.url].filter((value): value is string => value !== null)),
    );
    return {
      results,
      statuses,
      failed_count: urls.filter((url) => !fetched.has(url)).length,
      cost_total: response.costDollars?.total ?? null,
    };
  },
});

const MAX_URLS = 100;
