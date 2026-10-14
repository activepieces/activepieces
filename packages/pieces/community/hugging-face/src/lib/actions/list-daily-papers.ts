import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfProps } from '../common/props';
import { hfUtils } from '../common/utils';
import { listDailyPapersOutputSchema } from '../output-schemas';

export const listDailyPapers = createAction({
  auth: huggingFaceAuth,
  name: 'list_daily_papers',
  classification: 'SEARCH',
  displayName: 'List Daily Papers',
  description: "List the research papers featured on Hugging Face's Daily Papers page.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists the research papers featured on Hugging Face Daily Papers for one day, ISO week or month (or the latest when none is given), sorted by publish date or trending, one page per call with next_page. Set at most one of Date, Week or Month. Use Search Papers to find papers by topic and Get Paper for one paper's details. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: listDailyPapersOutputSchema,
  props: {
    date: Property.ShortText({
      displayName: 'Date',
      description: "Papers featured on this day, in 'YYYY-MM-DD' form, for example '2026-09-22'.",
      required: false,
    }),
    week: Property.ShortText({
      displayName: 'Week',
      description: "Papers featured in this ISO week, in 'YYYY-Www' form, for example '2026-W38'.",
      required: false,
    }),
    month: Property.ShortText({
      displayName: 'Month',
      description: "Papers featured in this month, in 'YYYY-MM' form, for example '2026-09'.",
      required: false,
    }),
    submitter: Property.ShortText({
      displayName: 'Submitter',
      description: 'Only papers submitted by this Hub username.',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sort order. Defaults to publish date.',
      required: false,
      defaultValue: 'publishedAt',
      options: {
        disabled: false,
        options: [
          { label: 'Publish Date', value: 'publishedAt' },
          { label: 'Trending', value: 'trending' },
        ],
      },
    }),
    limit: hfProps.limit({ defaultValue: 50, max: 100 }),
    page: hfProps.page(),
  },
  async run(context) {
    const { date, week, month, submitter, sort, limit, page } = context.propsValue;
    hfUtils.assertLimit({ value: limit, min: 1, max: 100, name: 'Limit' });
    hfUtils.assertLimit({ value: page, min: 0, max: Number.MAX_SAFE_INTEGER, name: 'Page' });
    const periods = [date, week, month].filter((value) => value !== undefined && value.trim().length > 0);
    if (periods.length > 1) {
      throw new Error('Set at most one of Date, Week or Month.');
    }
    const pageNumber = page ?? 0;
    const pageSize = limit ?? 50;
    const response = await hfHub.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/api/daily_papers',
      query: [
        ['date', date?.trim()],
        ['week', week?.trim()],
        ['month', month?.trim()],
        ['submitter', submitter],
        ['sort', sort],
        ['limit', pageSize],
        ['p', pageNumber],
      ],
    });
    const papers = Array.isArray(response.body) ? response.body : [];
    return {
      papers,
      count: papers.length,
      page: pageNumber,
      next_page: papers.length >= pageSize ? pageNumber + 1 : null,
    };
  },
});
