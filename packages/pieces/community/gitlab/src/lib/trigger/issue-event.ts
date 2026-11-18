import { randomBytes, timingSafeEqual } from 'crypto';
import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { gitlabCommon } from '../common';
import { gitlabAuth } from '../auth';
import { GitlabAuthValue, gitlabToken, projectPath } from '../common/client';
import {
  GitlabApiError,
  isRecord,
  sendGitlabRequest,
} from '../common/secret-request';
import { ProjectWebhook } from '../common/models';
import { issueEventOutputSchema } from '../output-schemas';

const sampleData = {
  object_kind: 'issue',
  event_type: 'issue',
  user: {
    id: 15269532,
    name: 'Kishan Parmar',
    username: 'kishanprmr',
    avatar_url:
      'https://secure.gravatar.com/avatar/4eabe7154116891e3ebc205e9754a832?s=80&d=identicon',
    email: '[REDACTED]',
  },
  project: {
    id: 48074457,
    name: 'basic-project-demo',
    description: null,
    web_url: 'https://gitlab.com/basic-group-demo/basic-project-demo',
    avatar_url: null,
    git_ssh_url: 'git@gitlab.com:basic-group-demo/basic-project-demo.git',
    git_http_url: 'https://gitlab.com/basic-group-demo/basic-project-demo.git',
    namespace: 'basic-group-demo',
    visibility_level: 0,
    path_with_namespace: 'basic-group-demo/basic-project-demo',
    default_branch: 'main',
    ci_config_path: '',
    homepage: 'https://gitlab.com/basic-group-demo/basic-project-demo',
    url: 'git@gitlab.com:basic-group-demo/basic-project-demo.git',
    ssh_url: 'git@gitlab.com:basic-group-demo/basic-project-demo.git',
    http_url: 'https://gitlab.com/basic-group-demo/basic-project-demo.git',
  },
  object_attributes: {
    author_id: 15269532,
    closed_at: null,
    confidential: false,
    created_at: '2023-09-01 07:03:02 UTC',
    description: '',
    discussion_locked: null,
    due_date: null,
    id: 133093523,
    iid: 32,
    last_edited_at: null,
    last_edited_by_id: null,
    milestone_id: null,
    moved_to_id: null,
    duplicated_to_id: null,
    project_id: 48074457,
    relative_position: null,
    state_id: 1,
    time_estimate: 0,
    title: 'Activepieces Testing',
    updated_at: '2023-09-01 07:03:02 UTC',
    updated_by_id: null,
    weight: null,
    health_status: null,
    url: 'https://gitlab.com/basic-group-demo/basic-project-demo/-/issues/32',
    total_time_spent: 0,
    time_change: 0,
    human_total_time_spent: null,
    human_time_change: null,
    human_time_estimate: null,
    assignee_ids: [],
    assignee_id: null,
    labels: [],
    state: 'opened',
    severity: 'unknown',
    customer_relations_contacts: [],
    action: 'open',
  },
  labels: [],
  changes: {
    author_id: { previous: null, current: 15269532 },
    created_at: { previous: null, current: '2023-09-01 07:03:02 UTC' },
    description: { previous: null, current: '' },
    id: { previous: null, current: 133093523 },
    iid: { previous: null, current: 32 },
    project_id: { previous: null, current: 48074457 },
    time_estimate: { previous: null, current: 0 },
    title: { previous: null, current: 'Activepieces Testing' },
    updated_at: { previous: null, current: '2023-09-01 07:03:02 UTC' },
  },
  repository: {
    name: 'basic-project-demo',
    url: 'git@gitlab.com:basic-group-demo/basic-project-demo.git',
    description: null,
    homepage: 'https://gitlab.com/basic-group-demo/basic-project-demo',
  },
};

export const issuesEventTrigger = createTrigger({
  auth: gitlabAuth,
  name: 'project_issue_event',
  classification: 'READ',
  displayName: 'New Project Issue Event',
  description:
    'Triggers on project issue events (including confidential issues) when an issue is created or when an existing issue is updated, closed, or reopened.',
  aiMetadata: {
    description:
      'Fires when an issue event, including on confidential issues, occurs in the configured GitLab project via webhook. The Issue Event prop scopes which actions fire: All, or only Opened, Closed, Reopened, or Updated. Represents the issue and its change set at the moment of the event.',
  },
  props: {
    projectId: gitlabCommon.projectId(),
    actiontype: Property.StaticDropdown({
      displayName: 'Issue Event',
      description: 'Issue Event type for trigger',
      defaultValue: 'all',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'All', value: 'all' },
          { label: 'Opened', value: 'open' },
          { label: 'Closed', value: 'close' },
          { label: 'Reopened', value: 'reopen' },
          { label: 'Updated', value: 'update' },
        ],
      },
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: sampleData,
  outputSchema: issueEventOutputSchema,

  async onEnable({ store, auth, propsValue, webhookUrl }) {
    const projectId = String(propsValue.projectId);
    const token = randomBytes(32).toString('hex');
    const response = await sendGitlabRequest<ProjectWebhook>({
      token: gitlabToken(auth),
      method: 'POST',
      path: `${projectPath(projectId)}/hooks`,
      body: {
        url: webhookUrl,
        token,
        issues_events: true,
        confidential_issues_events: true,
        push_events: false,
        enable_ssl_verification: true,
      },
    });
    const webhookId = response.body.id;
    try {
      await store.put<WebhookInformation>(ISSUE_TRIGGER_STORE_KEY, {
        webhookId,
        projectId,
        token,
      });
    } catch (error) {
      await deleteProjectHook({ auth, projectId, webhookId });
      throw error;
    }
  },

  async onDisable({ auth, store }) {
    const stored = await store.get<WebhookInformation>(ISSUE_TRIGGER_STORE_KEY);
    if (stored === null || stored === undefined) {
      return;
    }
    await deleteProjectHook({
      auth,
      projectId: String(stored.projectId),
      webhookId: stored.webhookId,
    });
    await store.delete(ISSUE_TRIGGER_STORE_KEY);
  },

  async run(context) {
    const stored = await context.store.get<WebhookInformation>(
      ISSUE_TRIGGER_STORE_KEY
    );
    if (
      !isAuthenticDelivery({
        storedToken: stored?.token,
        headers: context.payload.headers,
      })
    ) {
      return [];
    }
    const body = context.payload.body;
    if (
      !matchesAction({
        payload: isRecord(body) ? body : undefined,
        actiontype: String(context.propsValue.actiontype ?? 'all'),
      })
    ) {
      return [];
    }
    return [body];
  },
});

async function deleteProjectHook({
  auth,
  projectId,
  webhookId,
}: {
  auth: GitlabAuthValue;
  projectId: string;
  webhookId: number | string;
}): Promise<void> {
  try {
    await sendGitlabRequest({
      token: gitlabToken(auth),
      method: 'DELETE',
      path: `${projectPath(projectId)}/hooks/${encodeURIComponent(
        String(webhookId)
      )}`,
    });
  } catch (error) {
    if (error instanceof GitlabApiError && error.status === 404) {
      return;
    }
    throw error;
  }
}

function headerValue({
  headers,
  name,
}: {
  headers: Record<string, string> | undefined;
  name: string;
}): string | undefined {
  if (!headers) {
    return undefined;
  }
  const match = Object.keys(headers).find((key) => key.toLowerCase() === name);
  return match === undefined ? undefined : headers[match];
}

export function isAuthenticDelivery({
  storedToken,
  headers,
}: {
  storedToken: string | undefined;
  headers: Record<string, string> | undefined;
}): boolean {
  if (storedToken === undefined || storedToken === '') {
    return true;
  }
  const received = headerValue({ headers, name: 'x-gitlab-token' });
  if (typeof received !== 'string') {
    return false;
  }
  const expected = Buffer.from(storedToken, 'utf8');
  const actual = Buffer.from(received, 'utf8');
  if (expected.length !== actual.length) {
    return false;
  }
  return timingSafeEqual(expected, actual);
}

function matchesAction({
  payload,
  actiontype,
}: {
  payload: Record<string, unknown> | undefined;
  actiontype: string;
}): boolean {
  if (actiontype === 'all') {
    return true;
  }
  const attributes = payload?.['object_attributes'];
  return isRecord(attributes) && attributes['action'] === actiontype;
}

interface WebhookInformation {
  webhookId: number | string;
  projectId: number | string;
  token?: string;
}

export const ISSUE_TRIGGER_STORE_KEY = 'gitlab_issue_trigger';
