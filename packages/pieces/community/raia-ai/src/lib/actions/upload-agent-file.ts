import { createAction, Property } from "@activepieces/pieces-framework";
import { raiaAiAuth } from "../common/auth";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { BASE_URL } from "../common/constants";
import FormData from 'form-data';

export const uploadAgentFileAction = createAction({
    name: 'upload-agent-file',
    displayName: 'Upload Agent File',
    description: 'Upload file to a Raia Agent.',
    auth: raiaAiAuth,
    props: {
        file: Property.File({
            displayName: 'File',
            required: true
        })
    },
    async run(context) {
        const {file} = context.propsValue

        const formData = new FormData();
        formData.append('file',file.data,{filename:file.filename})

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: BASE_URL + '/agent-files/upload',
            headers: {
                'Agent-Secret-Key': context.auth.secret_text,
                ...formData.getHeaders()
            },
            body: formData
        })

        return response.body
    }
})