import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteAiProps } from '../../common/ai-props';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOnenoteUpdatePageContentOutputSchema } from '../../output-schemas';

const ACTIONS = ['append', 'prepend', 'insert', 'replace'];

const POSITIONS = ['after', 'before'];

export const updatePageContentAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_update_page_content',
  outputSchema: microsoftOnenoteUpdatePageContentOutputSchema,
  displayName: 'Update Page Content',
  description: 'Changes the content of a OneNote page.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Applies one or more changes to a OneNote page (ID from List Pages): append, prepend, insert or replace HTML at a target. Target "body" or "title", or an element ID from Get Page Content with Include Element IDs set to true. Not idempotent: repeating an append adds the content again.',
    idempotent: false,
  },
  props: {
    pageId: microsoftOneNoteAiProps.pageId({ required: true }),
    changes: Property.Array({
      displayName: 'Changes',
      description: 'The changes to apply, in order.',
      required: true,
      properties: {
        target: Property.ShortText({
          displayName: 'Target',
          description: '"body", "title", or an element data-id or id (#id) from Get Page Content.',
          required: true,
        }),
        action: Property.StaticDropdown({
          displayName: 'Action',
          description:
            'append, prepend, insert or replace. "title" accepts only replace; "body" accepts append and prepend.',
          required: true,
          options: {
            disabled: false,
            options: ACTIONS.map((value) => ({ label: value, value })),
          },
        }),
        position: Property.StaticDropdown({
          displayName: 'Position',
          description: 'For append and insert: after (default) or before the target.',
          required: false,
          options: {
            disabled: false,
            options: POSITIONS.map((value) => ({ label: value, value })),
          },
        }),
        content: Property.LongText({
          displayName: 'Content',
          description: 'HTML to add, or the new text for a title replace.',
          required: true,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const changes = (propsValue.changes ?? []).map((change, index) => toCommand({ change, index }));
    if (changes.length === 0) {
      throw new Error('Changes must contain at least one change.');
    }
    await microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote/pages/${encodeURIComponent(propsValue.pageId)}/content`)
      .patch(changes);
    return { pageId: propsValue.pageId, appliedChanges: changes.length };
  },
});

function toCommand({ change, index }: { change: unknown; index: number }): PatchCommand {
  if (typeof change !== 'object' || change === null) {
    throw new Error(`Change ${index + 1} must be an object with target, action and content.`);
  }
  const target = 'target' in change ? change.target : undefined;
  const action = 'action' in change ? change.action : undefined;
  const position = 'position' in change ? change.position : undefined;
  const content = 'content' in change ? change.content : undefined;
  if (typeof target !== 'string' || target === '') {
    throw new Error(`Change ${index + 1} needs a target.`);
  }
  if (typeof action !== 'string' || !ACTIONS.includes(action)) {
    throw new Error(`Change ${index + 1} action must be one of: ${ACTIONS.join(', ')}.`);
  }
  if (
    position !== undefined &&
    position !== null &&
    position !== '' &&
    (typeof position !== 'string' || !POSITIONS.includes(position))
  ) {
    throw new Error(`Change ${index + 1} position must be one of: ${POSITIONS.join(', ')}.`);
  }
  if (typeof content !== 'string') {
    throw new Error(`Change ${index + 1} needs content.`);
  }
  return {
    target,
    action,
    content,
    ...(typeof position === 'string' && position !== '' ? { position } : {}),
  };
}

type PatchCommand = {
  target: string;
  action: string;
  position?: string;
  content: string;
};
