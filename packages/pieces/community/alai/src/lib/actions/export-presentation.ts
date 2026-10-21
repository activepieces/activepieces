import { createAction, Property } from '@activepieces/pieces-framework';
import { alaiAuth } from '../common/auth';
import { alaiClient } from '../common/client';
import { alaiOutputSchemas } from '../common/output-schemas';
import { exportFormatOptions, presentationIdProp } from './shared-props';

export const exportPresentation = createAction({
  auth: alaiAuth,
  name: 'exportPresentation',
  classification: 'WRITE',
  displayName: 'Export Presentation',
  description: 'Export a presentation as a link, PDF and/or PowerPoint file.',
  audience: 'human',
  outputSchema: alaiOutputSchemas.generation,
  aiMetadata: {
    description:
      'Starts an export of an existing Alai presentation to link, pdf and/or ppt by presentation ID. By default returns at once with generation_id; set waitForCompletion to wait (max 480 s) and get link_url, pdf_url and ppt_url (signed, valid about 24 h). Fails if a requested format failed. Not idempotent: each call starts a new export job.',
    idempotent: false,
  },
  props: {
    presentationId: presentationIdProp('The presentation to export.'),
    exportFormats: Property.StaticMultiSelectDropdown({
      displayName: 'Export Formats',
      description: 'Formats to produce.',
      required: true,
      options: { options: exportFormatOptions },
    }),
    waitForCompletion: Property.Checkbox({
      displayName: 'Wait for Completion',
      description: 'Wait until Alai finishes. If off, use "Get Generation" with the returned ID later.',
      required: false,
      defaultValue: false,
    }),
    maxWaitTime: Property.Number({
      displayName: 'Max Wait Time (seconds)',
      description: 'How long to wait when waiting is on. Default 300, capped at 480.',
      required: false,
      defaultValue: 300,
    }),
  },
  async run({ auth, propsValue }) {
    const presentationId = alaiClient.pathId({ value: propsValue.presentationId, label: 'Presentation ID' });
    const formats = alaiClient.exportFormats(propsValue.exportFormats);
    if (formats.length === 0) {
      throw new Error('Choose at least one export format.');
    }
    return alaiClient.startGeneration({
      apiKey: auth.props.apiKey,
      path: `/presentations/${presentationId}/exports`,
      body: { formats },
      waitForCompletion: propsValue.waitForCompletion,
      maxWaitTime: propsValue.maxWaitTime,
      requestedFormats: formats,
    });
  },
});
