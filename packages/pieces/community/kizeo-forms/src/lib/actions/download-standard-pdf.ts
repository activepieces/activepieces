import { createAction, Property } from '@activepieces/pieces-framework';
import { endpoint, kizeoFormsCommon } from '../common';
import axios from 'axios';
import { kizeoFormsAuth } from '../..';

export const downloadStandardPDF = createAction({
  auth: kizeoFormsAuth,
  name: 'download_standard_pdf', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Download Standard PDF',
  description: 'Get PDF data of a form',
  audience: 'both',
  aiMetadata: { description: 'Download the standard PDF rendering of one submitted Kizeo Forms data record, identified by form ID and data ID, returned as a base64 data URI. Use when you need the generated PDF document for a specific submission. Read-only and idempotent.', idempotent: true },
  props: {
    formId: kizeoFormsCommon.formId,
    dataId: Property.Number({
      displayName: 'Data Id',
      description: undefined,
      required: true,
    }),
  },
  async run(context) {
    const { formId, dataId } = context.propsValue;
    const response = await axios.get(
      endpoint +
        `v3/forms/${formId}/data/${dataId}/pdf?used-with-actives-pieces=`,
      {
        headers: {
          'Content-Type': 'application/pdf',
          Authorization: context.auth.secret_text,
        },
        responseType: 'arraybuffer',
      }
    );

    if (response.status === 200) {
      return (
        'data:application/pdf;base64,' +
        Buffer.from(response.data).toString('base64')
      );
    }

    return [];
  },
});
