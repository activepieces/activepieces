import { createAction } from '@activepieces/pieces-framework'
import { slackSendMessage } from '../common/utils'
import { slackAuth } from "../../";
import { assertNotNullOrUndefined, ExecutionType, PauseType } from '@activepieces/shared';
import { profilePicture, text, userId, username } from '../common/props';

export const slackSendApprovalDirectMessageAction = createAction({
    auth: slackAuth,
    name: 'send_approval_direct_message',
    displayName: 'Send Approval Message To A User',
    description: 'Send approval message to a user',
    sampleData: {
        success: true,
        message: 'sample message',
        results: [1, 2, 3, 4],
    },
    props: {
        userId,
        text,
        username,
        profilePicture,
    },
    async run(context) {
        if (context.executionType === ExecutionType.BEGIN) {
            context.run.pause({
                pauseMetadata: {
                    type: PauseType.WEBHOOK,
                    actions: ['approve', 'disapprove'],
                }
            });
            const token = context.auth.access_token
            const { userId, username, profilePicture } = context.propsValue

            assertNotNullOrUndefined(token, 'token')
            assertNotNullOrUndefined(text, 'text')
            assertNotNullOrUndefined(userId, 'userId')
            const approvalLink = `${context.serverUrl}v1/flow-runs/${context.run.id}/resume?action=approve`;
            const disapprovalLink = `${context.serverUrl}v1/flow-runs/${context.run.id}/resume?action=disapprove`;

            slackSendMessage({
                token,
                text: `${context.propsValue.text}\n\nApprove: ${approvalLink}\n\nDisapprove: ${disapprovalLink}`,
                username,
                profilePicture,
                conversationId: userId,
            });
      
            return {}
        } else {
            const payload = context.resumePayload as { action: string };
      
            return {
              approved: payload.action === 'approve',
            }
        }
    },
})