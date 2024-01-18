import { createAction, Property } from '@activepieces/pieces-framework';
import { endpoint, kizeoFormsCommon } from '../common';
import axios from 'axios';
import { kizeoFormsAuth } from '../..';

export const downloadCustomExportInItsOriginalFormat = createAction({
  auth: kizeoFormsAuth,
  name: 'download_custom_export_in_its_original_format', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Download custom export in its original format',
  description: 'Download a custom export in its original format',
  props: {
    formId: kizeoFormsCommon.formId,
    exportId: kizeoFormsCommon.exportId,
    exportInPdf: Property.Checkbox({
      displayName: 'Export in PDF',
      description: undefined,
      required: true,
    }),
    dataId: Property.Number({
      displayName: 'Data Id',
      description: undefined,
      required: true,
    }),
  },
  async run(context) {
    const { formId, dataId, exportId, exportInPdf } = context.propsValue;
    let uri = '';
    let headers = {};
    if (exportInPdf) {
      uri =
        endpoint +
        `v3/forms/${formId}/data/${dataId}/pdf?used-with-actives-pieces=`;
      headers = {
        'Content-Type': 'application/pdf',
        Authorization: context.auth,
      };
    } else {
      uri =
        endpoint +
        `v3/forms/${formId}/data/${dataId}/exports/${exportId}?used-with-n8n=`;
      headers = {
        Accept:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        Authorization: context.auth,
      };
    }

    const response = await axios.get(uri, {
      headers: headers,
      responseType: 'arraybuffer',
    });

    if (response.status === 200) {
      return (
        'data:application/octet-stream;base64,' +
        Buffer.from(response.data).toString('base64')
      );
    }

    return [];
  },
});
