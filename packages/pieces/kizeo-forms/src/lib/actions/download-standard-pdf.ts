import { createAction, Property } from '@activepieces/pieces-framework';
import { endpoint, kizeoFormsCommon } from '../common';
import axios from "axios";

export const downloadStandardPDF = createAction({
    name: 'download_standard_pdf', // Must be a unique across the piece, this shouldn't be changed.
    displayName: 'Download Standard PDF',
    description: 'Get PDF data of a form',
    props: {
        // Properties to ask from the user, in this ask we will take number
        authentication: kizeoFormsCommon.authentication,
        formId: kizeoFormsCommon.formId,
        dataId: Property.Number({
            displayName: 'Data Id',
            description: undefined,
            required: true,
        })
    },
    async run(context) {
        const { authentication: personalToken, formId, dataId } = context.propsValue
        const response = await axios.get(endpoint + `v3/forms/${formId}/data/${dataId}/pdf?used-with-actives-pieces=`, {
            headers: {
                'Content-Type': 'application/pdf',
                'Authorization': personalToken,
            },
            responseType: 'arraybuffer'
        });

        if (response.status === 200) {
            return Buffer.from(response.data).toString('base64')
        }

    return []
  },
});
