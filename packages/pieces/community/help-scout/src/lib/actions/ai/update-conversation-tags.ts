import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutApi } from '../../common/api';
import { helpScoutAuth } from '../../common/auth';
import { helpScoutOutputSchemas } from '../../common/output-schemas';

export const updateConversationTags = createAction({
  auth: helpScoutAuth,
  name: 'update_conversation_tags',
  classification: 'WRITE',
  displayName: 'Update Conversation Tags',
  description: 'Adds, removes or replaces the tags of a conversation.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds tags to, removes tags from, or replaces all tags of a Help Scout conversation. add and remove keep the other existing tags; replace sets exactly the given list (empty list clears all tags). Unknown tag names are created. Returns the resulting tag list. Idempotent: repeating converges to the same tags. Help Scout has no conditional tag update, so the action re-reads the tags after writing and re-applies once if a concurrent change was detected; a change made in the same instant can still be lost.',
    idempotent: true,
  },
  outputSchema: helpScoutOutputSchemas['updateConversationTags'],
  props: {
    conversationId: Property.Number({
      displayName: 'Conversation ID',
      description: 'Numeric Help Scout conversation ID (the id field from Search Conversations, not the #number shown in the UI).',
      required: true,
    }),
    tags: Property.Array({ displayName: 'Tags', description: 'Tag names, for example ["vip", "billing"].', required: true }),
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      required: true,
      defaultValue: 'add',
      options: {
        disabled: false,
        options: [
          { label: 'Add', value: 'add' },
          { label: 'Remove', value: 'remove' },
          { label: 'Replace', value: 'replace' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const path = `/conversations/${helpScoutApi.encodeId(propsValue.conversationId)}`;
    const requested = helpScoutApi.toStringList(propsValue.tags);
    const mode = propsValue.mode === 'remove' || propsValue.mode === 'replace' ? propsValue.mode : 'add';
    const readTags = async (): Promise<string[]> => {
      const response = await helpScoutApi.request({ method: HttpMethod.GET, path, auth });
      return helpScoutApi.readTagNames(response.body);
    };
    const writeTags = async (tags: string[]): Promise<void> => {
      await helpScoutApi.request({ method: HttpMethod.PUT, path: `${path}/tags`, auth, body: { tags } });
    };
    if (mode === 'replace') {
      const replaced = helpScoutApi.mergeTags({ current: [], requested, mode });
      await writeTags(replaced);
      return { conversationId: String(propsValue.conversationId), tags: replaced };
    }
    const before = await readTags();
    await writeTags(helpScoutApi.mergeTags({ current: before, requested, mode }));
    const after = await readTags();
    const reconciled = helpScoutApi.mergeTags({ current: after, requested, mode });
    if (!sameTags({ left: reconciled, right: after })) {
      await writeTags(reconciled);
    }
    return { conversationId: String(propsValue.conversationId), tags: reconciled };
  },
});

function sameTags({ left, right }: { left: string[]; right: string[] }): boolean {
  return tagKey(left) === tagKey(right);
}

function tagKey(tags: string[]): string {
  return tags.map((tag) => tag.trim().toLowerCase()).sort().join('\n');
}
