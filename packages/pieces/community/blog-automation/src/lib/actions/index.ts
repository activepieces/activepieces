import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { baRequest, blogAutomationAuth, clean, props } from '../common';

type Job = { id: number; status: 'running' | 'done' | 'failed'; articleId: number | null; article: unknown; error: { error: string; message: string } | null; tokens: { used: number; balance: number } | null };

// polling of async writing jobs (env overrides only for tests)
const pollMs = () => Number(process.env['BA_POLL_MS'] || 5000);
const maxWaitMs = () => Number(process.env['BA_MAX_WAIT_MS'] || 9 * 60 * 1000);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const createIdea = createAction({
  auth: blogAutomationAuth,
  name: 'create_idea',
  displayName: 'Create Idea',
  description: 'Adds an idea to the idea board.',
  props: {
    title: Property.ShortText({ displayName: 'Title', required: true }),
    keyword: Property.ShortText({ displayName: 'Keyword', required: false }),
    notes: Property.LongText({ displayName: 'Notes', description: 'Notes for the writer / the AI (max. 2000 characters).', required: false }),
    audience: Property.ShortText({ displayName: 'Audience', required: false }),
    priority: Property.StaticDropdown({ displayName: 'Priority', required: false, options: { options: [{ label: 'High', value: 1 }, { label: 'Normal', value: 2 }, { label: 'Low', value: 3 }] } }),
    siteId: props.site(),
    language: props.language(),
  },
  async run({ auth, propsValue: p }) {
    return baRequest(auth, HttpMethod.POST, '/ideas', clean({ title: p.title, keyword: p.keyword, notes: p.notes, audience: p.audience, priority: p.priority, siteId: p.siteId, language: p.language }));
  },
});

export const writeArticle = createAction({
  auth: blogAutomationAuth,
  name: 'write_article',
  displayName: 'Write Article with AI',
  description: 'Writes a complete article with AI (own topic, from an idea and/or with a template). Uses tokens like in the app.',
  props: {
    topic: Property.ShortText({ displayName: 'Topic', description: 'Required unless you pick an idea or give a keyword.', required: false }),
    keyword: Property.ShortText({ displayName: 'Keyword', required: false }),
    ideaId: props.idea(),
    templateId: props.template(),
    siteId: props.site(),
    language: props.language(),
    length: Property.StaticDropdown({ displayName: 'Length', required: false, options: { options: [{ label: 'Short', value: 'short' }, { label: 'Medium', value: 'medium' }, { label: 'Long', value: 'long' }] } }),
    tone: Property.ShortText({ displayName: 'Tone', required: false }),
    audience: Property.ShortText({ displayName: 'Audience', required: false }),
    notes: Property.LongText({ displayName: 'Notes', description: 'Extra instructions for the AI.', required: false }),
    withImage: Property.Checkbox({ displayName: 'With Featured Image', description: 'Also create an AI image (extra tokens).', required: false, defaultValue: false }),
    wait: Property.Checkbox({ displayName: 'Wait for Completion', description: 'Wait until the article is written (checks every 5 s, up to 9 minutes). Off, or still running after that: returns the job – read it later with "Get Writing Job".', required: false, defaultValue: true }),
  },
  async run({ auth, propsValue: p }) {
    if (!p.topic && !p.keyword && !p.ideaId) throw new Error('Please give a topic, a keyword or an idea.');
    const res = await baRequest<{ job: Job }>(auth, HttpMethod.POST, '/articles/generate', clean({ topic: p.topic, keyword: p.keyword, ideaId: p.ideaId, templateId: p.templateId,
      siteId: p.siteId, language: p.language, length: p.length, tone: p.tone, audience: p.audience, notes: p.notes, withImage: p.withImage, async: true }));
    let job = res.job;
    if (p.wait === false) return job;
    const until = Date.now() + maxWaitMs();
    while (job.status === 'running' && Date.now() < until) {
      await sleep(pollMs());
      job = await baRequest<Job>(auth, HttpMethod.GET, `/jobs/${job.id}`);
    }
    if (job.status === 'failed') throw new Error(`Blog Automation: ${job.error?.message || job.error?.error || 'writing failed'}`);
    return job;
  },
});

export const getJob = createAction({
  auth: blogAutomationAuth,
  name: 'get_job',
  displayName: 'Get Writing Job',
  description: 'Reads an AI writing job: status running / done / failed and the article when done.',
  props: { jobId: Property.Number({ displayName: 'Job ID', description: 'The id returned by "Write Article with AI".', required: true }) },
  async run({ auth, propsValue: p }) {
    return baRequest(auth, HttpMethod.GET, `/jobs/${p.jobId}`);
  },
});

export const publishArticle = createAction({
  auth: blogAutomationAuth,
  name: 'publish_article',
  displayName: 'Publish Article',
  description: 'Publishes an article to WordPress right away (approves it first; a published article is pushed again).',
  props: { articleId: props.article(), siteId: props.site() },
  async run({ auth, propsValue: p }) {
    return baRequest(auth, HttpMethod.POST, `/articles/${p.articleId}/publish`, clean({ siteId: p.siteId }));
  },
});

export const addToCalendar = createAction({
  auth: blogAutomationAuth,
  name: 'add_to_calendar',
  displayName: 'Add Article to Calendar',
  description: "Schedules an article in the editorial calendar – at a given time or the site's next free slot.",
  props: {
    articleId: props.article(),
    at: Property.ShortText({ displayName: 'Publish At', description: 'ISO 8601 date-time (e.g. 2026-12-01T09:30:00+01:00) or "next" for the next free slot of the site.', required: true, defaultValue: 'next' }),
    siteId: props.site(),
  },
  async run({ auth, propsValue: p }) {
    const at = String(p.at || 'next').trim();
    if (at !== 'next' && Number.isNaN(Date.parse(at))) throw new Error('Publish At: an ISO 8601 date-time or "next".');
    return baRequest(auth, HttpMethod.POST, `/articles/${p.articleId}/schedule`, clean({ at, siteId: p.siteId }));
  },
});

export const getArticleStatus = createAction({
  auth: blogAutomationAuth,
  name: 'get_article_status',
  displayName: 'Get Article Status',
  description: 'Status, schedule, WordPress link, last error and the publishing job of an article.',
  props: { articleId: props.article() },
  async run({ auth, propsValue: p }) {
    return baRequest(auth, HttpMethod.GET, `/articles/${p.articleId}/status`);
  },
});

export const getTokenBalance = createAction({
  auth: blogAutomationAuth,
  name: 'get_token_balance',
  displayName: 'Get Token Balance',
  description: 'Token balance, open lots with expiry and the price per AI action.',
  props: {},
  async run({ auth }) {
    return baRequest(auth, HttpMethod.GET, '/tokens');
  },
});
