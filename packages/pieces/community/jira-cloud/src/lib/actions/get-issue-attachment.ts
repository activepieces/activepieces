import { createAction, Property } from "@activepieces/pieces-framework";
import { jiraCloudAuth } from "../../auth";
import { jiraApiCall } from "../common";
import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";

export const getIssueAttachmentAction = createAction({
    auth: jiraCloudAuth,
    name: 'get-issue-attachment',
    displayName: 'Get Issue Attachment',
    description: 'Retrieves an attachment from an issue.',
    props: {
        attachmentId: Property.ShortText({
            displayName: 'Attachment ID',
            required: true
        })
    },
    async run(context) {
        const { attachmentId } = context.propsValue;

        // https://community.developer.atlassian.com/t/download-attachment-from-rest-api/40860/2
        const attachmentResponse = await jiraApiCall<{ filename: string, content: string }>({
            method: HttpMethod.GET,
            resourceUri: `/attachment/${attachmentId}`,
            auth: context.auth,
        })

        const { filename, content } = attachmentResponse;

        const response = await httpClient.sendRequest({
            url: content,
            method: HttpMethod.GET,
            authentication: {
                type: AuthenticationType.BASIC,
                username: context.auth.email,
                password: context.auth.apiToken,
            },
            responseType:'arraybuffer'
        })

        return {
            ...attachmentResponse,
            file: await context.files.write({
                fileName: filename,
                data: Buffer.from(response.body)
            })
        }
    }
})