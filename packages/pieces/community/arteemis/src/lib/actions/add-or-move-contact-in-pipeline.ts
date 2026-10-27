import { createAction } from '@activepieces/pieces-framework';
import { arteemisAuth } from '../auth';
import { arteemisApi } from '../common/client';
import { contactIdProp, stageDropdown } from '../common/props';

type Added = { added_contact_ids: string[]; stopped_enrollments: number; stage: string };
type Moved = { stage: string; stage_id: string };

export const addOrMoveContactInPipeline = createAction({
  auth: arteemisAuth,
  name: 'add_or_move_contact_in_pipeline',
  classification: 'WRITE',
  displayName: 'Add or Move Contact in Pipeline',
  description: 'Puts a contact in your pipeline (first stage) or moves them to the stage you choose. Adding a contact ends their live campaign sequences.',
  audience: 'both',
  aiMetadata: {
    description:
      'Put an Arteemis contact (by contact ID) in the pipeline, at the first stage or at the stage given; a contact already in the pipeline is moved, never added twice. Adding ends the contact\'s live campaign sequences. Safe to retry.',
    idempotent: true,
  },
  props: {
    contact_id: contactIdProp(),
    stage: stageDropdown,
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const contactId = context.propsValue.contact_id.trim();
    const stage = context.propsValue.stage;
    // add leaves anyone already in the pipeline where they are; move then sends them to the stage.
    const { data: added } = await arteemisApi.call<Added>({
      apiKey,
      tool: 'deals_manage',
      body: { operation: 'add', contact_ids: [contactId] },
    });
    const moved = stage
      ? (
          await arteemisApi.call<Moved>({
            apiKey,
            tool: 'deals_manage',
            body: { operation: 'move', contact_id: contactId, stage },
          })
        ).data
      : undefined;
    return {
      contact_id: contactId,
      added: added.added_contact_ids.length > 0,
      stopped_enrollments: added.stopped_enrollments,
      stage: moved?.stage ?? added.stage,
      stage_id: moved?.stage_id ?? null,
    };
  },
});
