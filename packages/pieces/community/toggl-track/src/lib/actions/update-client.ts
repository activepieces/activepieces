import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglModels, TwoClient } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

export const updateClient = createAction({
  auth: togglTrackAuth,
  name: 'update_client',
  classification: 'WRITE',
  displayName: 'Update Client',
  description: 'Update the name, notes, or external reference of a client.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates a client by ID; omitted fields keep their value, and Clear Notes empties the notes. Notes and external reference are Classic only. Returns the updated client. Safe to retry.',
    idempotent: true,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    client_id: togglCommon.required_client_id,
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'Leave empty to keep the current name.',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description:
        'Leave empty to keep the current notes. Toggl Track (Classic) only.',
      required: false,
    }),
    clear_notes: Property.Checkbox({
      displayName: 'Clear Notes',
      description: 'Remove the notes. Toggl Track (Classic) only.',
      required: false,
      defaultValue: false,
    }),
    external_reference: Property.ShortText({
      displayName: 'External Reference',
      description:
        'Leave empty to keep the current value. Toggl Track (Classic) only.',
      required: false,
    }),
  },
  outputSchema: togglOutputSchemas.client,
  async run(context) {
    const { name, notes, clear_notes, external_reference } =
      context.propsValue;
    const auth = context.auth;
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });
    const clientId = togglApi.requireId({
      value: context.propsValue.client_id,
      label: 'Client',
    });
    const path = `/workspaces/${workspaceId}/clients/${clientId}`;
    const hasNotes = notes !== undefined && notes !== null && notes !== '';
    if (hasNotes && clear_notes) {
      throw new Error('Set Notes or Clear Notes, not both.');
    }

    return togglApi.withNotFound({
      label: `Client ${clientId}`,
      run: async () => {
        if (togglApi.isTwo(auth)) {
          if (hasNotes || clear_notes || external_reference) {
            throw togglApi.classicOnlyError(
              'Updating client notes or external reference'
            );
          }
          if (!name) {
            throw new Error('Provide a New Name to update.');
          }
          await togglApi.request<unknown>({
            auth,
            method: togglApi.HttpMethod.PUT,
            path,
            body: { name },
          });
          const updated = await togglApi.request<TwoClient>({
            auth,
            method: togglApi.HttpMethod.GET,
            path,
          });
          return togglModels.client(updated);
        }

        const body = {
          ...(name ? { name } : {}),
          ...(hasNotes ? { notes } : {}),
          ...(clear_notes ? { notes: '' } : {}),
          ...(external_reference ? { external_reference } : {}),
        };
        if (Object.keys(body).length === 0) {
          throw new Error('Provide at least one field to update.');
        }
        const current = await togglApi.request<{
          name: string;
          notes?: string | null;
          external_reference?: string | null;
        }>({
          auth,
          method: togglApi.HttpMethod.GET,
          path,
        });
        return togglApi.request<Record<string, unknown>>({
          auth,
          method: togglApi.HttpMethod.PUT,
          path,
          body: {
            name: current.name,
            ...(current.notes ? { notes: current.notes } : {}),
            ...(current.external_reference
              ? { external_reference: current.external_reference }
              : {}),
            ...body,
          },
        });
      },
    });
  },
});
