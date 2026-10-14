import { createAction } from '@activepieces/pieces-framework';
import { mauticAuth } from '../auth';
import { mauticApi } from '../common/api';
import { mauticProps } from '../common/props';
import { updateMauticContactOutputSchema } from '../output-schemas';

export const updateContactAction = createAction({
  auth: mauticAuth,
  description: 'Update a contact in Mautic CRM',
  audience: 'human',
  aiMetadata: {
    description:
      "Update an existing Mautic contact, identified by its numeric contact id, with the provided field values. Use when you already know the contact id (resolve it first with Search Contact if you only have an email or name). Idempotent: applying the same field values to the same id repeatedly leaves the contact in the same state.",
    idempotent: true,
  },
  displayName: 'Update Contact With Contact Id',
  name: 'update_mautic_contact',
  outputSchema: updateMauticContactOutputSchema,
  classification: 'WRITE',
  props: {
    id: mauticProps.entityId({ required: true }),
    fields: mauticProps.contactFields({ required: true }),
  },
  run: async function (context) {
    return await mauticApi.updateContact({
      auth: context.auth,
      id: context.propsValue.id,
      fields: context.propsValue.fields,
    });
  },
});
