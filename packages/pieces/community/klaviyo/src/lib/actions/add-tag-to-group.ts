import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApi, pathFor } from '../common/client';
import { klaviyoInputs } from '../common/ai-props';
import { klaviyoOutputSchemas } from '../common/output-schemas';

export const addTagToGroup = createAction({
  auth: klaviyoAuth,
  name: 'add_tag_to_group',
  classification: 'WRITE',
  displayName: 'Add Tag to List or Segment',
  description: 'Tag lists or segments so you can organise them in Klaviyo.',
  audience: 'both',
  aiMetadata: {
    description: 'Adds an existing tag to one or more Klaviyo lists or segments. Use to organise groups by tag; find the tag ID with Find Tag by Name and list or segment IDs with List Lists, Find List by Name or List Segments. Idempotent: tagging a group that already has the tag changes nothing.',
    idempotent: true,
  },
  outputSchema: klaviyoOutputSchemas.tagGroupAdded,
  props: {
    tag_id: Property.ShortText({
      displayName: 'Tag ID',
      description: 'The tag ID. Find it with Find Tag by Name.',
      required: true,
    }),
    target_type: Property.StaticDropdown<string>({
      displayName: 'Target Type',
      description: 'Whether the IDs below are lists or segments.',
      required: true,
      options: {
        options: [
          { label: 'List', value: 'list' },
          { label: 'Segment', value: 'segment' },
        ],
      },
    }),
    target_ids: Property.Array({
      displayName: 'List or Segment IDs',
      description: 'One or more list or segment IDs (up to 100).',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const tagId = klaviyoInputs.requireText({ value: propsValue.tag_id, label: 'Tag ID' });
    const targetType = klaviyoInputs.oneOf({ value: propsValue.target_type, label: 'Target Type', allowed: ['list', 'segment'] });
    if (targetType === undefined) {
      throw new Error('Target Type is required.');
    }
    const targetIds = (propsValue.target_ids ?? []).map((id) => klaviyoInputs.optionalText(id)).filter((id): id is string => id !== undefined);
    if (targetIds.length === 0) {
      throw new Error('Provide at least one list or segment ID.');
    }
    if (targetIds.length > MAX_TARGETS) {
      throw new Error(`Provide at most ${MAX_TARGETS} list or segment IDs per call.`);
    }
    await klaviyoApi.send({
      auth,
      method: HttpMethod.POST,
      path: `${pathFor(['tags', tagId])}/relationships/${targetType}s`,
      body: { data: targetIds.map((id) => ({ type: targetType, id })) },
    });
    return { success: true, tag_id: tagId, target_type: targetType, target_ids: targetIds };
  },
});

const MAX_TARGETS = 100;
