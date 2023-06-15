import { createAction, Property } from '@activepieces/pieces-framework';
import { endpoint, kizeoFormsCommon } from '../common';
import axios from "axios";

export const downloadCustomExportInItsOriginalFormat = createAction({
    name: 'download_custom_export_in_its_original_format', // Must be a unique across the piece, this shouldn't be changed.
    displayName: 'Download custom export in its original format',
    description: 'Download a custom export in its original format',
    props: {
        // Properties to ask from the user, in this ask we will take number
        authentication: kizeoFormsCommon.authentication,
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
        })
    },
    async run(context) {
        const { authentication: personalToken, formId, dataId, exportId, exportInPdf } = context.propsValue
        let uri = ""
		let headers = {}
        if (exportInPdf) {
            uri = endpoint + `v3/forms/${formId}/data/${dataId}/pdf?used-with-actives-pieces=`
            headers = {
                'Content-Type': 'application/pdf',
                'Authorization': personalToken,
            }
        } else {
            uri = endpoint + `v3/forms/${formId}/data/${dataId}/exports/${exportId}?used-with-n8n=`
            headers = {
                'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Authorization': personalToken,
            }
        }

        const response = await axios.get(uri, {
            headers: headers,
            responseType: 'arraybuffer'
        });

        if (response.status === 200) {
            return Buffer.from(response.data).toString('base64')
        }

    return []
  },
});
