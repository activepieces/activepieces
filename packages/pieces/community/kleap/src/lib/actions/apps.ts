import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { kleapAuth } from '../auth';
import { JsonObject, kleapRequest, publishAndWait, resolveAppId } from '../common/client';
import { appDropdown, publishWhenDoneProp, taskOptionProps, waitProps } from '../common/props';
import { runIds, runTask, taskBody } from '../common/task';

export const createApp = createAction({
  auth: kleapAuth,
  name: 'create_app',
  displayName: 'Create App',
  description:
    'Builds a new website or web app with AI from a prompt (1 to 5 minutes). Needs at least 5 credits. Optionally waits for the build and publishes it.',
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Describe the site: what the business does, pages, tone, colours, forms…',
      required: true,
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      description: 'Who can see the app inside Kleap. Publishing to a public URL is separate.',
      required: false,
      defaultValue: 'personal',
      options: {
        options: [
          { label: 'Personal', value: 'personal' },
          { label: 'Public', value: 'public' },
          { label: 'Workspace', value: 'workspace' },
        ],
      },
    }),
    ...waitProps(),
    publish_when_done: publishWhenDoneProp(),
    ...taskOptionProps(),
  },
  async run(context) {
    const p = context.propsValue;
    const prompt = (p.prompt ?? '').trim();
    if (!prompt) throw new Error('The prompt is empty.');
    const body = taskBody({ prompt, visibility: p.visibility || 'personal' }, p, runIds(context));
    const started = await kleapRequest(context.auth, HttpMethod.POST, '/apps', { body });
    return runTask(context.auth, started['app_id'] ? String(started['app_id']) : undefined, started, p);
  },
});

export const editAppWithAi = createAction({
  auth: kleapAuth,
  name: 'edit_app_with_ai',
  displayName: 'Edit App With AI',
  description:
    'Asks the Kleap AI to change an existing app ("add a pricing page", "add a database"…). Needs at least 2 credits. Optionally waits and publishes.',
  props: {
    app_id: appDropdown(),
    message: Property.LongText({
      displayName: 'Message',
      description: 'What to change, in plain language.',
      required: true,
    }),
    ...waitProps(),
    publish_when_done: publishWhenDoneProp(),
    ...taskOptionProps(),
  },
  async run(context) {
    const p = context.propsValue;
    const message = (p.message ?? '').trim();
    if (!message) throw new Error('The message is empty.');
    const appId = await resolveAppId(context.auth, p.app_id);
    const started = await kleapRequest(context.auth, HttpMethod.POST, `/apps/${appId}/messages`, {
      body: taskBody({ message }, p, runIds(context)),
    });
    return runTask(context.auth, appId, { app_id: Number(appId), ...started }, p);
  },
});

export const publishApp = createAction({
  auth: kleapAuth,
  name: 'publish_app',
  displayName: 'Publish App',
  description:
    'Deploys the app to its public URL. If a deploy is already running, follows that one. Returns the quality report once live.',
  props: {
    app_id: appDropdown(),
    wait_for_live: Property.Checkbox({
      displayName: 'Wait Until Live',
      description: 'Wait until the site answers on its public URL (usually under 2 minutes).',
      required: false,
      defaultValue: true,
    }),
    timeout_minutes: Property.Number({
      displayName: 'Timeout (Minutes)',
      description: 'How long to wait at most (max 20). On timeout the step returns the status with wait_timed_out: true.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const appId = await resolveAppId(context.auth, p.app_id);
    return publishAndWait(context.auth, appId, p.wait_for_live !== false, p.timeout_minutes ?? 10);
  },
});

export const getPublishStatus = createAction({
  auth: kleapAuth,
  name: 'get_publish_status',
  displayName: 'Get Publish Status',
  description:
    'Returns published / deploying / running / queued / not_published, plus the production URL and quality report once live.',
  props: {
    app_id: appDropdown(),
    deploy_key: Property.ShortText({
      displayName: 'Deploy Key',
      description: 'Optional: the deploy_key returned by Publish App, to follow that specific deploy.',
      required: false,
    }),
  },
  async run(context) {
    const appId = await resolveAppId(context.auth, context.propsValue.app_id);
    return kleapRequest(context.auth, HttpMethod.GET, `/apps/${appId}/publish`, {
      query: { deploy_key: context.propsValue.deploy_key },
    });
  },
});

export const getApp = createAction({
  auth: kleapAuth,
  name: 'get_app',
  displayName: 'Get App',
  description: 'Returns an app: name, slug, preview and production URLs, domains…',
  props: { app_id: appDropdown() },
  async run(context) {
    const appId = await resolveAppId(context.auth, context.propsValue.app_id);
    return kleapRequest(context.auth, HttpMethod.GET, `/apps/${appId}`);
  },
});

export const listApps = createAction({
  auth: kleapAuth,
  name: 'list_apps',
  displayName: 'List Apps',
  description: 'Lists your apps, newest first, optionally filtered by name.',
  props: {
    search: Property.ShortText({ displayName: 'Search', description: 'Filter by name or slug.', required: false }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of apps to return (pages of 100 are fetched as needed).',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const limit = Math.max(1, Number(context.propsValue.limit ?? 50));
    const apps: JsonObject[] = [];
    let offset = 0;
    let total: unknown = undefined;
    while (apps.length < limit) {
      const page = await kleapRequest<{ apps?: JsonObject[]; pagination?: JsonObject }>(
        context.auth,
        HttpMethod.GET,
        '/apps',
        { query: { limit: Math.min(100, limit - apps.length), offset, q: context.propsValue.search } },
      );
      apps.push(...(page.apps ?? []));
      const pagination = page.pagination ?? {};
      total = pagination['total'];
      if (!pagination['has_more'] || pagination['next_offset'] == null) break;
      offset = Number(pagination['next_offset']);
    }
    return { apps, count: apps.length, total: total ?? apps.length };
  },
});

export const findApp = createAction({
  auth: kleapAuth,
  name: 'find_app',
  displayName: 'Find App',
  description: 'Finds the app behind a site URL, a custom domain or a slug.',
  props: {
    query: Property.ShortText({
      displayName: 'URL, Domain or Slug',
      description: 'e.g. https://my-site.kleap.io, www.example.com or my-site',
      required: true,
    }),
  },
  async run(context) {
    return kleapRequest(context.auth, HttpMethod.GET, '/apps/resolve', { query: { q: context.propsValue.query.trim() } });
  },
});

export const renameApp = createAction({
  auth: kleapAuth,
  name: 'rename_app',
  displayName: 'Rename App',
  description: 'Changes the app name shown in Kleap.',
  props: {
    app_id: appDropdown(),
    name: Property.ShortText({ displayName: 'New Name', required: true }),
  },
  async run(context) {
    const appId = await resolveAppId(context.auth, context.propsValue.app_id);
    return kleapRequest(context.auth, HttpMethod.PATCH, `/apps/${appId}`, { body: { name: context.propsValue.name } });
  },
});

export const wakeApp = createAction({
  auth: kleapAuth,
  name: 'wake_app',
  displayName: 'Wake App',
  description: 'Wakes the app\'s preview environment so the preview URL answers quickly.',
  props: { app_id: appDropdown() },
  async run(context) {
    const appId = await resolveAppId(context.auth, context.propsValue.app_id);
    return kleapRequest(context.auth, HttpMethod.POST, `/apps/${appId}/wake`, { timeoutMs: 120_000 });
  },
});

export const getScreenshot = createAction({
  auth: kleapAuth,
  name: 'get_screenshot',
  displayName: 'Get Screenshot',
  description: 'Returns a screenshot URL of the app (image_url, width, height, captured_at).',
  props: { app_id: appDropdown() },
  async run(context) {
    const appId = await resolveAppId(context.auth, context.propsValue.app_id);
    return kleapRequest(context.auth, HttpMethod.GET, `/apps/${appId}/screenshot`, { timeoutMs: 120_000 });
  },
});

export const getChatHistory = createAction({
  auth: kleapAuth,
  name: 'get_chat_history',
  displayName: 'Get Chat History',
  description: 'Returns the latest messages exchanged with the Kleap AI for this app.',
  props: {
    app_id: appDropdown(),
    limit: Property.Number({ displayName: 'Limit', description: 'Up to 100.', required: false, defaultValue: 20 }),
  },
  async run(context) {
    const appId = await resolveAppId(context.auth, context.propsValue.app_id);
    return kleapRequest(context.auth, HttpMethod.GET, `/apps/${appId}/messages`, {
      query: { limit: Math.min(100, Math.max(1, Number(context.propsValue.limit ?? 20))) },
    });
  },
});

export const generateImage = createAction({
  auth: kleapAuth,
  name: 'generate_image',
  displayName: 'Generate Image',
  description: 'Generates an image with AI and saves it into the app (e.g. public/hero.png).',
  props: {
    app_id: appDropdown(),
    prompt: Property.LongText({ displayName: 'Image Prompt', required: true }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'Where to save it: public/….png, .jpg or .webp',
      required: true,
      defaultValue: 'public/images/generated.png',
    }),
    hd: Property.Checkbox({ displayName: 'HD', required: false, defaultValue: false }),
    width: Property.Number({ displayName: 'Width', required: false }),
    height: Property.Number({ displayName: 'Height', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const appId = await resolveAppId(context.auth, p.app_id);
    const body: JsonObject = { prompt: p.prompt, path: p.path };
    if (p.hd) body['hd'] = true;
    if (p.width) body['width'] = p.width;
    if (p.height) body['height'] = p.height;
    return kleapRequest(context.auth, HttpMethod.POST, `/apps/${appId}/generate-image`, { body, timeoutMs: 180_000 });
  },
});
