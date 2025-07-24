import {
  createAction,
  Property,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { hunterAuth } from '../common/auth';
import { validateLeadId } from '../common/props';
import { LeadService } from '../common/lead-service';

export const deleteLeadAction = createAction({
  name: 'delete_lead',
  auth: hunterAuth,
  displayName: 'Delete a Lead',
  description: 'Deletes an existing lead.',
  props: {
    id: Property.Number({
      displayName: 'ID',
      description: 'Identifier of the lead.',
      required: true,
    }),
    confirm_deletion: Property.Checkbox({
      displayName: 'Confirm Deletion',
      description: 'Check this box to confirm you want to permanently delete this lead',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { id, confirm_deletion } = propsValue;

    validateLeadId(id);

    if (!confirm_deletion) {
      throw new Error('Please confirm the deletion by checking the confirmation box');
    }

    const leadService = new LeadService(auth as string);

    try {
      return await leadService.deleteLead(id);
    } catch (error: any) {
      if (error.message.includes('404')) {
        throw new Error(`Lead with ID ${id} not found`);
      }

      if (error.message.includes('400')) {
        throw new Error('Bad request: Please check your input parameters.');
      }

      if (error.message.includes('403')) {
        throw new Error('Access forbidden: You do not have permission to delete this lead.');
      }

      throw new Error(`Failed to delete lead: ${error.message}`);
    }
  },
}); 