import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import { capsuleCrmProps } from '../common/props';

export const addNoteToEntityAction = createAction({
  auth: capsuleCrmAuth,
  name: 'add_note_to_entity',
  displayName: 'Add Note to Entity',
  description:
    'Add a comment or note to a contact, opportunity, project, or case.',
  props: {
    content: Property.LongText({
      displayName: 'Note Content',
      description: 'The text of the note you want to add.',
      required: true,
    }),
    party_id: capsuleCrmProps.contact_id(false),
    opportunity_id: capsuleCrmProps.opportunity_id(false),
    project_id: capsuleCrmProps.project_id(false),
    case_id: capsuleCrmProps.case_id(false),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const { party_id, opportunity_id, project_id, case_id } = propsValue;

    if (!party_id && !opportunity_id && !project_id && !case_id) {
      throw new Error(
        'At least one entity (Contact, Opportunity, Project, or Case) must be selected to add a note.'
      );
    }

    return await capsuleCrmClient.createNote(auth, {
      content: propsValue.content,
      partyId: party_id as number | undefined,
      opportunityId: opportunity_id as number | undefined,
      projectId: project_id as number | undefined,
      caseId: case_id as number | undefined,
    });
  },
});
