import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { presentonAuth } from '../../common/auth';
import { presentonClient } from '../../common/client';
import { presentationExportPresentationOutputSchema } from '../../output-schemas';

export const exportPresentation = createAction({
  auth: presentonAuth,
  name: 'presentation_export_presentation',
  outputSchema: presentationExportPresentationOutputSchema,
  displayName: 'Export Presentation',
  description: 'Export a presentation as PPTX, PDF or PNG.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Exports an existing presentation to a downloadable file and returns its path. Get the presentation id from presentation_list_presentations. Consumes credits on every call, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    id: Property.ShortText({ displayName: 'Presentation ID', description: 'From presentation_list_presentations.', required: true }),
    export_as: Property.StaticDropdown({
      displayName: 'Export As',
      required: true,
      options: {
        options: [
          { value: 'pptx', label: 'PPTX' },
          { value: 'pdf', label: 'PDF' },
          { value: 'png', label: 'PNG' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    return presentonClient.request<Record<string, unknown>>({
      auth: auth.secret_text,
      method: HttpMethod.POST,
      path: '/api/v3/presentation/export',
      body: { id: propsValue.id, export_as: propsValue.export_as },
    });
  },
});
