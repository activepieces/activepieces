import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, optionalText, requireText, triStateValue } from '../../common/props';
import { isRecord } from '../../common/secret-request';
import { hookOutputSchema } from '../../output-schemas-admin';

export function hookEventProps(description: string) {
  return {
    pushEvents: gitlabProps.triState('Push Events', description),
    tagPushEvents: gitlabProps.triState('Tag Push Events', description),
    issuesEvents: gitlabProps.triState('Issue Events', description),
    confidentialIssuesEvents: gitlabProps.triState('Confidential Issue Events', description),
    mergeRequestsEvents: gitlabProps.triState('Merge Request Events', description),
    noteEvents: gitlabProps.triState('Comment Events', description),
    pipelineEvents: gitlabProps.triState('Pipeline Events', description),
    jobEvents: gitlabProps.triState('Job Events', description),
    releasesEvents: gitlabProps.triState('Release Events', description),
    wikiPageEvents: gitlabProps.triState('Wiki Page Events', description),
  };
}

export function requireHookUrl(value: unknown): string {
  const text = requireText({ value: value, label: 'URL' });
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new Error('URL must be a full http or https address.');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('URL must start with http:// or https://.');
  }
  return text;
}

export function hookBody(propsValue: Record<string, unknown>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const event of HOOK_EVENTS) {
    const value = triStateValue(propsValue[event.prop]);
    if (value !== undefined) body[event.key] = value;
  }
  const name = optionalText(propsValue['name']);
  if (name !== undefined) body['name'] = name;
  const description = optionalText(propsValue['description']);
  if (description !== undefined) body['description'] = description;
  if (typeof propsValue['pushEventsBranchFilter'] === 'string' && propsValue['pushEventsBranchFilter'].trim() !== '') {
    body['push_events_branch_filter'] = propsValue['pushEventsBranchFilter'].trim();
  }
  const ssl = triStateValue(propsValue['enableSslVerification']);
  if (ssl !== undefined) body['enable_ssl_verification'] = ssl;
  return body;
}

export function withoutToken(hook: unknown): unknown {
  if (!isRecord(hook)) {
    return hook;
  }
  return Object.fromEntries(Object.entries(hook).filter(([key]) => key !== 'token'));
}

export function hookCommonProps() {
  return {
    name: Property.ShortText({ displayName: 'Name', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    pushEventsBranchFilter: Property.ShortText({ displayName: 'Push Branch Filter', description: 'Only push events for branches matching this wildcard, e.g. main or release/*.', required: false }),
    enableSslVerification: gitlabProps.triState('SSL Verification', 'Leave empty for the GitLab default (yes).'),
  };
}

export const createProjectWebhookAction = createAction({
  auth: gitlabAuth,
  name: 'create_project_webhook',
  displayName: 'Create Project Webhook',
  description: 'Adds a webhook to a project that calls a URL on the chosen events.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Adds a webhook to a GitLab project that POSTs to a URL on the events set to yes (push events default to yes in GitLab, the rest to no). No secret token is set here so it never lands in run history; add one in GitLab if the receiver needs it. Each call adds another webhook, even for the same URL; check List Project Webhooks first. Requires Maintainer role.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    url: Property.ShortText({ displayName: 'URL', description: 'Address GitLab will POST events to.', required: true }),
    ...hookCommonProps(),
    ...hookEventProps('Leave empty for the GitLab default.'),
  },
  outputSchema: hookOutputSchema,
  async run({ auth, propsValue }) {
    const url = requireHookUrl(propsValue.url);
    const hook = await gitlabRequest({ auth, 
      method: 'POST',
      path: `${projectPath(propsValue.projectId)}/hooks`,
      body: { url, ...hookBody(propsValue) },
    });
    return withoutToken(hook);
  },
});

export const HOOK_EVENTS = [
  { prop: 'pushEvents', key: 'push_events', label: 'Push Events' },
  { prop: 'tagPushEvents', key: 'tag_push_events', label: 'Tag Push Events' },
  { prop: 'issuesEvents', key: 'issues_events', label: 'Issue Events' },
  { prop: 'confidentialIssuesEvents', key: 'confidential_issues_events', label: 'Confidential Issue Events' },
  { prop: 'mergeRequestsEvents', key: 'merge_requests_events', label: 'Merge Request Events' },
  { prop: 'noteEvents', key: 'note_events', label: 'Comment Events' },
  { prop: 'pipelineEvents', key: 'pipeline_events', label: 'Pipeline Events' },
  { prop: 'jobEvents', key: 'job_events', label: 'Job Events' },
  { prop: 'releasesEvents', key: 'releases_events', label: 'Release Events' },
  { prop: 'wikiPageEvents', key: 'wiki_page_events', label: 'Wiki Page Events' },
] as const;
