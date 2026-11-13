import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { figmaAuth } from '../auth';
import { figmaWebhook, FigmaEventType, WebhookStore } from '../common/webhook';
import { figmaOutputSchemas } from '../output-schemas';

const triggeredBy = { id: '1234567890', handle: 'Jane Designer' };
const base = { file_key: 'HMvFQs5gIn9vdRYGCwgF9O', file_name: 'AP Figma test', timestamp: '2026-10-25T10:00:00Z', webhook_id: '123456' };

const contextInfo = Property.MarkDown({
  value:
    'Team ID: open the team in Figma; the URL is figma.com/files/team/**1234567890**/... Project ID: open the project; the URL is figma.com/files/project/**12345678**/... File: paste the file URL.',
});

export const newCommentTrigger = createTrigger({
  auth: figmaAuth,
  name: 'new_comment',
  classification: 'READ',
  displayName: 'New Comment',
  description:
    'Triggers when someone comments on a file in a team, project or single file. Needs a Figma Professional plan or higher (Starter teams are refused); team webhooks need a team admin, project and file webhooks need edit access.',
  aiMetadata: {
    description:
      'Fires when a comment or reply is posted on a watched Figma file (FILE_COMMENT webhook). The event has comment_id, parent_id (set for replies), the comment text parts, mentions and triggered_by. Requires a Figma Professional plan or higher. Watches a team, project or file. Duplicate deliveries from Figma retries are dropped.',
  },
  type: TriggerStrategy.WEBHOOK,
  outputSchema: figmaOutputSchemas.newComment,
  sampleData: {
    event_type: 'FILE_COMMENT',
    ...base,
    comment_id: '987654',
    parent_id: '',
    order_id: '12',
    created_at: '2026-10-25T10:00:00Z',
    resolved_at: '',
    comment: [{ text: 'Can we make this button bigger?' }],
    mentions: [],
    triggered_by: triggeredBy,
  },
  props: {
    context: figmaWebhook.contextProp,
    team_id: figmaWebhook.contextIdProp({ displayName: 'Team, Project or File ID' }),
    info: contextInfo,
  },
  ...webhookHooks({ eventType: 'FILE_COMMENT', contextKey: 'team_id' }),
});

export const newFileVersionTrigger = createTrigger({
  auth: figmaAuth,
  name: 'new_file_version',
  classification: 'READ',
  displayName: 'New File Version',
  description:
    'Triggers when a named version is saved in a file\'s version history. Needs a Figma Professional plan or higher (Starter teams are refused); team webhooks need a team admin, project and file webhooks need edit access.',
  aiMetadata: {
    description:
      'Fires when a named version is created in the version history of a watched Figma file (FILE_VERSION_UPDATE webhook), with version_id, label, description and triggered_by. Requires a Figma Professional plan or higher. Watches a team, project or file. Duplicate deliveries from Figma retries are dropped.',
  },
  type: TriggerStrategy.WEBHOOK,
  outputSchema: figmaOutputSchemas.newVersion,
  sampleData: {
    event_type: 'FILE_VERSION_UPDATE',
    ...base,
    version_id: '2345678901',
    label: 'Ready for dev',
    description: 'Final hand-off',
    created_at: '2026-10-25T10:00:00Z',
    triggered_by: triggeredBy,
  },
  props: {
    context: figmaWebhook.contextProp,
    context_id: figmaWebhook.contextIdProp({ displayName: 'Team, Project or File ID' }),
    info: contextInfo,
  },
  ...webhookHooks({ eventType: 'FILE_VERSION_UPDATE', contextKey: 'context_id' }),
});

export const fileUpdatedTrigger = createTrigger({
  auth: figmaAuth,
  name: 'file_updated',
  classification: 'READ',
  displayName: 'File Updated',
  description:
    'Triggers when a file is edited (Figma sends this after about 30 minutes without further edits). Needs a Figma Professional plan or higher (Starter teams are refused); team webhooks need a team admin, project and file webhooks need edit access.',
  aiMetadata: {
    description:
      'Fires when a watched Figma file was saved or edited (FILE_UPDATE webhook); Figma sends it after about 30 minutes of inactivity, so it is not real-time. Only file_key and file_name are included. Requires a Figma Professional plan or higher. Watches a team, project or file. Duplicate deliveries from Figma retries are dropped.',
  },
  type: TriggerStrategy.WEBHOOK,
  outputSchema: figmaOutputSchemas.fileUpdated,
  sampleData: { event_type: 'FILE_UPDATE', ...base },
  props: {
    context: figmaWebhook.contextProp,
    context_id: figmaWebhook.contextIdProp({ displayName: 'Team, Project or File ID' }),
    info: contextInfo,
  },
  ...webhookHooks({ eventType: 'FILE_UPDATE', contextKey: 'context_id' }),
});

export const fileDeletedTrigger = createTrigger({
  auth: figmaAuth,
  name: 'file_deleted',
  classification: 'READ',
  displayName: 'File Deleted',
  description:
    'Triggers when a file is deleted. Needs a Figma Professional plan or higher (Starter teams are refused); team webhooks need a team admin, project and file webhooks need edit access.',
  aiMetadata: {
    description:
      'Fires when a watched Figma file is deleted (FILE_DELETE webhook), with file_key, file_name and triggered_by. Not sent for files inside a deleted folder. Requires a Figma Professional plan or higher. Watches a team, project or file. Duplicate deliveries from Figma retries are dropped.',
  },
  type: TriggerStrategy.WEBHOOK,
  outputSchema: figmaOutputSchemas.fileDeleted,
  sampleData: { event_type: 'FILE_DELETE', ...base, triggered_by: triggeredBy },
  props: {
    context: figmaWebhook.contextProp,
    context_id: figmaWebhook.contextIdProp({ displayName: 'Team, Project or File ID' }),
    info: contextInfo,
  },
  ...webhookHooks({ eventType: 'FILE_DELETE', contextKey: 'context_id' }),
});

export const libraryPublishedTrigger = createTrigger({
  auth: figmaAuth,
  name: 'library_published',
  classification: 'READ',
  displayName: 'Library Published',
  description:
    'Triggers when a library file is published (components, styles or variables changed). Needs a Figma Professional plan or higher (Starter teams are refused); team webhooks need a team admin, project and file webhooks need edit access.',
  aiMetadata: {
    description:
      'Fires when a watched Figma library file is published (LIBRARY_PUBLISH webhook), listing created, modified and deleted components, styles and variables. A large publish may arrive as several events. Requires a Figma Professional plan or higher. Watches a team, project or file. Duplicate deliveries from Figma retries are dropped.',
  },
  type: TriggerStrategy.WEBHOOK,
  outputSchema: figmaOutputSchemas.libraryPublished,
  sampleData: {
    event_type: 'LIBRARY_PUBLISH',
    ...base,
    description: 'New buttons',
    created_at: '2026-10-25T10:00:00Z',
    created_components: [{ key: 'abc123', name: 'Button / Primary' }],
    modified_components: [],
    deleted_components: [],
    created_styles: [],
    modified_styles: [{ key: 'def456', name: 'Brand / Blue' }],
    deleted_styles: [],
    created_variables: [],
    modified_variables: [],
    deleted_variables: [],
    triggered_by: triggeredBy,
  },
  props: {
    context: figmaWebhook.contextProp,
    context_id: figmaWebhook.contextIdProp({ displayName: 'Team, Project or File ID' }),
    info: contextInfo,
  },
  ...webhookHooks({ eventType: 'LIBRARY_PUBLISH', contextKey: 'context_id' }),
});

function webhookHooks({ eventType, contextKey }: { eventType: FigmaEventType; contextKey: 'team_id' | 'context_id' }) {
  return {
    async onEnable(context: HookContext) {
      await figmaWebhook.enable({
        auth: context.auth,
        eventType,
        context: context.propsValue['context'],
        contextId: context.propsValue[contextKey],
        webhookUrl: context.webhookUrl,
        store: context.store,
      });
    },
    async onDisable(context: HookContext) {
      await figmaWebhook.disable({ auth: context.auth, store: context.store });
    },
    async run(context: RunContext) {
      return figmaWebhook.receive({ body: context.payload.body, eventType, store: context.store });
    },
  };
}

type HookContext = {
  auth: unknown;
  propsValue: Record<string, unknown>;
  webhookUrl: string;
  store: WebhookStore;
};

type RunContext = {
  payload: { body: unknown };
  store: WebhookStore;
};
