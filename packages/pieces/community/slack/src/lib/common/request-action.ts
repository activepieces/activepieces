import { slackSendMessage } from './utils';
import {
  assertNotNullOrUndefined,
  ExecutionType,
  PauseType,
} from '@activepieces/shared';

export const requestAction = async (conversationId: string, context: any) => {
  const { actions } = context.propsValue;
  assertNotNullOrUndefined(actions, 'actions');

  if (!actions.length) {
    throw new Error(`Must have at least one button action`);
  }

  const actionTextToIds = actions.map((actionText: string) => {
    if (!actionText) {
      throw new Error(`Button text for the action cannot be empty`);
    }

    return {
      actionText,
      actionId: encodeURI(actionText as string),
    };
  });

  if (context.executionType === ExecutionType.BEGIN) {
    context.run.pause({
      pauseMetadata: {
        type: PauseType.WEBHOOK,
        actions: actionTextToIds.map((action: any) => action.actionId),
      },
    });

    const token = context.auth.access_token;
    const { text, username, profilePicture } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(text, 'text');

    const actionElements = actionTextToIds.map((action: any) => {
      const actionLink = context.generateResumeUrl({
        queryParams: { action: action.actionId },
      })

      return {
        type: 'button',
        text: {
          type: 'plain_text',
          text: action.actionText,
        },
        style: 'primary',
        url: actionLink,
      };
    });

    return await slackSendMessage({
      token,
      text: `${context.propsValue.text}`,
      username,
      profilePicture,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${context.propsValue.text}`,
          },
        },
        {
          type: 'actions',
          block_id: 'actions',
          elements: actionElements,
        },
      ],
      conversationId: conversationId,
    });
  } else {
    const payload = context.resumePayload as { action: string };

    return {
      action: decodeURI(payload.action),
    };
  }
};
