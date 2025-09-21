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
    const relatedEntity: {
      partyId?: number;
      opportunityId?: number;
      projectId?: number;
      caseId?: number;
    } = {};
    if (propsValue.party_id) {
      relatedEntity.partyId = propsValue.party_id as number;
    } else if (propsValue.opportunity_id) {
      relatedEntity.opportunityId = propsValue.opportunity_id as number;
    } else if (propsValue.project_id) {
      relatedEntity.projectId = propsValue.project_id as number;
    } else if (propsValue.case_id) {
      relatedEntity.caseId = propsValue.case_id as number;
    }
    if (Object.keys(relatedEntity).length === 0) {
      throw new Error(
        'At least one entity (Contact, Opportunity, Project, or Case) must be selected to add a note.'
      );
    }
    return await capsuleCrmClient.createNote(auth, {
      content: propsValue.content,
      ...relatedEntity,
    });
  },
});
