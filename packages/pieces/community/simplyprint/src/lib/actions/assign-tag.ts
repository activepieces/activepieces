import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

/**
 * `tags/Assign` is a multi-subject endpoint — it routes via a numeric `type`
 * field (TagSubject enum: 1=printer, 2=printer group, 3=file, 4=queue item)
 * and applies a TagData payload via TagAssigningController. We expose just
 * the custom-tag-id case here since that's what most automation flows want;
 * nozzle/bedType/material tags are auto-set from gcode and have their own
 * dedicated props on Add to Queue / Upload & Queue.
 */
export const assignTagAction = createAction({
  auth: simplyprintAuth,
  name: 'assign_tag',
  displayName: 'Assign Custom Tag',
  description:
    'Attach an existing custom tag to a printer, printer group, file, or queue item. Use "Create or Update Tag" first to get the tag ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Attach one or more existing custom tags (by tag ID) to printers, printer groups, files, or queue items, selected via the subject type. By default it merges the tags into the subject\'s current set, so re-applying the same tags is harmless; enable "Replace existing tags" to overwrite the subject\'s tags instead, which is a destructive mode. The tags must already exist (create them first); this does not auto-create tags.',
    idempotent: true,
  },
  props: {
    subjectType: Property.StaticDropdown<1 | 2 | 3 | 4>({
      displayName: 'Subject type',
      description: 'What kind of entity to tag.',
      required: true,
      options: {
        options: [
          { label: 'Printer', value: 1 },
          { label: 'Printer group', value: 2 },
          { label: 'File (UserFile)', value: 3 },
          { label: 'Queue item', value: 4 },
        ],
      },
    }),
    subjectIds: Property.Array({
      displayName: 'Subject IDs',
      description:
        'Numeric IDs (or UID strings for files) of the entities to tag. Provide one or many.',
      required: true,
    }),
    tagIds: Property.Array({
      displayName: 'Custom tag IDs',
      description: 'Numeric custom tag IDs to attach. From "List Tags" or "Create or Update Tag".',
      required: true,
    }),
    override: Property.Checkbox({
      displayName: 'Replace existing tags',
      description:
        'When true, replaces the subject\'s current custom tags. When false (default), merges with existing tags.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const subjects = context.propsValue.subjectIds ?? [];
    if (subjects.length === 0) throw new Error('Provide at least one subject ID.');
    const tagIds = (context.propsValue.tagIds ?? []).map(Number).filter((n) => n > 0);
    if (tagIds.length === 0) throw new Error('Provide at least one custom tag ID.');

    // NB: don't send `edited: 'custom'` — backend's post_validation has
    // `tag_id => required_if:edited,custom` (legacy single-tag field), so
    // setting `edited` triggers a validation rule we don't satisfy. The
    // `edited` field is logging-only, safe to omit.
    //
    // Use `tag_ids` (new format), NOT `custom`. Assign.php only copies
    // `nozzle` / `nozzleData` / `material` / `bedType` / `tag_ids` /
    // `tag_id` / `detach_tag_ids` from POST into the payload it forwards
    // to TagAssigningController. A bare `custom` field is silently
    // dropped, the controller sees an empty payload, and throws
    // "Invalid data!". `tag_ids` gets normalised to `custom` inside
    // TagAssigningController::tagAssignFromPost (validator strips the
    // alias on the way through).
    const body: Record<string, unknown> = {
      type: context.propsValue.subjectType,
      tag_ids: tagIds,
    };
    if (subjects.length === 1) {
      body['id'] = subjects[0];
    } else {
      body['ids'] = subjects;
    }
    if (context.propsValue.override) body['override'] = true;

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'tags/Assign',
      body,
    });
  },
});
