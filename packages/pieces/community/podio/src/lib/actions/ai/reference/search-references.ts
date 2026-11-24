import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioSearchReferencesOutputSchema } from '../../../output-schemas';

export const searchReferencesAction = createAction({
  auth: podioAuth,
  name: 'podio_search_references',
  outputSchema: podioSearchReferencesOutputSchema,
  displayName: 'Search References',
  description: 'Searches for the objects (users, items, spaces, apps, tags and more) that can be referenced in a given place.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Searches the objects that can be used in one context, grouped by kind: for example the items an app relationship field can link to ("item_field" with target params {"field_id"}), the users a task can be assigned to ("task_responsible"), or the spaces and apps to search in. Returns ids that the matching create and update actions take.',
    idempotent: true,
  },
  props: {
    target: podioAiProps.choice({
      required: true,
      displayName: 'Target',
      description: 'Where the references will be used.',
      values: ['task_reference', 'task_responsible', 'alert', 'conversation', 'conversation_presence', 'grant', 'item_field', 'item_created_by', 'item_created_via', 'item_location', 'item_tags', 'global_nav', 'script_variables', 'apps', 'invite', 'extension', 'spaces', 'flow_app_dependencies', 'giphys', 'hash_tag', 'search_in', 'search_by'],
    }),
    targetParams: podioAiProps.json({
      required: false,
      displayName: 'Target Parameters',
      description: 'Extra parameters for the target: {"field_id", "not_item_ids"} for "item_field"; {"app_id"} for "item_created_by", "item_created_via" and "item_tags"; {"field_id", "subfield"} for "item_location"; {"task_id"} for "task_responsible".',
    }),
    text: podioAiProps.text({ required: false, displayName: 'Search Text', description: 'The text to search for.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of results to return. Defaults to 20.' }),
  },
  async run({ auth, propsValue }) {
    const groups = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.POST,
      path: '/reference/search',
      body: podioUtils.body({
        values: {
          target: propsValue.target,
          target_params: propsValue.targetParams,
          text: propsValue.text,
          limit: propsValue.limit ?? 20,
        },
      }),
    });
    return { groups, count: groups.length };
  },
});
