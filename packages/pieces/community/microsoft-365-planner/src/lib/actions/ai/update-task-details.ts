import { randomUUID } from 'crypto';

import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerUtils } from '../../common/utils';
import { microsoft365PlannerTaskDetailsOutputSchema } from '../../output-schemas';

export const updateTaskDetailsAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_update_task_details',
  outputSchema: microsoft365PlannerTaskDetailsOutputSchema,
  displayName: 'Update Task Details',
  description: 'Edits a task’s description, checklist and links.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets a Planner task’s description, adds checklist items, checks, unchecks or removes existing ones (item IDs from Get Task Details), and adds or removes links. Returns the updated details. Only what you set changes. Each call with Add Checklist Items adds new items, even with the same titles.',
    idempotent: false,
  },
  props: {
    taskId: microsoft365PlannerAiProps.taskId({ required: true }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New description (replaces the current one).',
      required: false,
    }),
    addChecklistItems: Property.Array({
      displayName: 'Add Checklist Items',
      description: 'Titles of checklist items to add, unchecked.',
      required: false,
    }),
    checkChecklistItemIds: Property.Array({
      displayName: 'Check Checklist Item IDs',
      description: 'Checklist item IDs (from Get Task Details) to mark done.',
      required: false,
    }),
    uncheckChecklistItemIds: Property.Array({
      displayName: 'Uncheck Checklist Item IDs',
      description: 'Checklist item IDs to mark not done.',
      required: false,
    }),
    removeChecklistItemIds: Property.Array({
      displayName: 'Remove Checklist Item IDs',
      description: 'Checklist item IDs to delete.',
      required: false,
    }),
    addLinks: Property.Array({
      displayName: 'Add Links',
      description: 'Links to attach to the task.',
      required: false,
      properties: {
        url: Property.ShortText({
          displayName: 'URL',
          description: 'Full URL, e.g. https://contoso.com/spec.docx.',
          required: true,
        }),
        alias: Property.ShortText({
          displayName: 'Name',
          description: 'Name shown for the link. Defaults to the URL.',
          required: false,
        }),
      },
    }),
    removeLinkUrls: Property.Array({
      displayName: 'Remove Link URLs',
      description: 'URLs of attached links to remove, exactly as attached.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const addItems = microsoft365PlannerUtils.stringIds({
      value: propsValue.addChecklistItems,
      propName: 'Add Checklist Items',
    });
    const checkIds = microsoft365PlannerUtils.stringIds({
      value: propsValue.checkChecklistItemIds,
      propName: 'Check Checklist Item IDs',
    });
    const uncheckIds = microsoft365PlannerUtils.stringIds({
      value: propsValue.uncheckChecklistItemIds,
      propName: 'Uncheck Checklist Item IDs',
    });
    const removeIds = microsoft365PlannerUtils.stringIds({
      value: propsValue.removeChecklistItemIds,
      propName: 'Remove Checklist Item IDs',
    });
    const removeUrls = microsoft365PlannerUtils.stringIds({
      value: propsValue.removeLinkUrls,
      propName: 'Remove Link URLs',
    });
    const addLinks = (propsValue.addLinks ?? []).map((link) => {
      if (
        typeof link !== 'object' ||
        link === null ||
        !('url' in link) ||
        typeof link.url !== 'string' ||
        link.url === ''
      ) {
        throw new Error('Each item in Add Links needs a URL.');
      }
      const alias =
        'alias' in link && typeof link.alias === 'string' && link.alias !== ''
          ? link.alias
          : link.url;
      return { url: link.url, alias };
    });
    const touchedIds = [...checkIds, ...uncheckIds, ...removeIds];
    if (new Set(touchedIds).size !== touchedIds.length) {
      throw new Error(
        'A checklist item ID can appear in only one of Check, Uncheck and Remove.'
      );
    }
    const checklist = {
      ...Object.fromEntries(
        addItems.map((title) => [
          randomUUID(),
          {
            '@odata.type': 'microsoft.graph.plannerChecklistItem',
            title,
            isChecked: false,
          },
        ])
      ),
      ...Object.fromEntries(
        checkIds.map((id) => [
          id,
          {
            '@odata.type': 'microsoft.graph.plannerChecklistItem',
            isChecked: true,
          },
        ])
      ),
      ...Object.fromEntries(
        uncheckIds.map((id) => [
          id,
          {
            '@odata.type': 'microsoft.graph.plannerChecklistItem',
            isChecked: false,
          },
        ])
      ),
      ...Object.fromEntries(removeIds.map((id) => [id, null])),
    };
    const references = {
      ...Object.fromEntries(
        addLinks.map((link) => [
          referenceKey({ url: link.url }),
          {
            '@odata.type': 'microsoft.graph.plannerExternalReference',
            alias: link.alias,
          },
        ])
      ),
      ...Object.fromEntries(
        removeUrls.map((url) => [referenceKey({ url }), null])
      ),
    };
    const fields = {
      ...(propsValue.description !== undefined
        ? { description: propsValue.description }
        : {}),
      ...(Object.keys(checklist).length > 0 ? { checklist } : {}),
      ...(Object.keys(references).length > 0 ? { references } : {}),
    };
    if (Object.keys(fields).length === 0) {
      throw new Error('Set at least one field to change.');
    }
    return await microsoft365PlannerApi.patchTaskDetails({
      auth,
      taskId: propsValue.taskId,
      fields,
    });
  },
});

function referenceKey({ url }: { url: string }): string {
  return url.replace(
    /[%.:@#]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}
