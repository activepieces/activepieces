import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';

import { gitlabCommon, makeClient } from '../common';
import { gitlabAuth } from '../..';
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
  displayName: 'New Project Issue Event',
  description:
    'Triggers on project issue events when an issue is created or when an existing issue is updated, closed, or reopened.',
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
          { label: 'Updated', value: 'update' },
        ],
      },
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: sampleData,

  async onEnable({ store, auth, propsValue, webhookUrl }) {
    const projectId = propsValue.projectId!;
    const client = makeClient({ auth });
    const res = await client.subscribeProjectWebhook(projectId, {
      url: webhookUrl,
      issues_events: true,
      push_events: false,
    });
    await store.put<WebhookInformation>('gitlab_issue_trigger', {
      webhookId: res.id,
      projectId: projectId as string,
    });
  },

  async onDisable({ auth, store }) {
    const response = await store.get<WebhookInformation>(
      'gitlab_issue_trigger'
    );
    if (response !== null && response !== undefined) {
      const client = makeClient({ auth });
      client.unsubscribeProjectWebhook(response.projectId, response.webhookId);
    }
  },

  async run(context) {
    const { actiontype } = context.propsValue;
    if (
      isVerificationCall(
        context.payload.body as Record<string, unknown>,
        actiontype as string
      )
    ) {
      return [context.payload.body];
    }
    return [];
  },
});

function isVerificationCall(payload: Record<string, any>, actiontype: string) {
  if (actiontype == 'all') {
    return true;
  }
  return payload['object_attributes']['action'] == actiontype;
}

interface WebhookInformation {
  webhookId: string;
  projectId: string;
}
