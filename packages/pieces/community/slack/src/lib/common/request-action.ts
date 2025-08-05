import { processMessageTimestamp, slackSendMessage } from './utils';
import {
  assertNotNullOrUndefined,
  ExecutionType,
  PauseType,
} from '@activepieces/shared';
import { ChatPostMessageResponse } from '@slack/web-api';

export const requestAction = async (conversationId: string, context: any) => {
  const { actions } = context.propsValue;
  assertNotNullOrUndefined(actions, 'actions');

  if (!actions.length) {
    throw new Error(`Must have at least one button action`);
  }

  const actionTextToIds = actions.map(
    ({ label, style }: { label: string; style: string }) => {
      if (!label) {
        throw new Error(`Button text for the action cannot be empty`);
      }

      return {
        label,
        style,
        actionId: encodeURI(label as string),
      };
    }
  );

  if (context.executionType === ExecutionType.BEGIN) {
    context.run.pause({
      pauseMetadata: {
        type: PauseType.WEBHOOK,
        actions: actionTextToIds.map(
          (action: { actionId: string }) => action.actionId
        ),
      },
    });

    const token = context.auth.access_token;
    const { text, username, profilePicture } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(text, 'text');

    const actionElements = actionTextToIds.map(
      (action: { label: string; style: string; actionId: string }) => {
        const actionLink = context.generateResumeUrl({
          queryParams: { action: action.actionId },
        });

        return {
          type: 'button',
          text: {
            type: 'plain_text',
            text: action.label,
          },
          ...(action.style && {style: action.style}),
          value: actionLink,
          action_id: action.actionId,
        };
      }
    );

    const messageResponse: ChatPostMessageResponse = await slackSendMessage({
      token,
      text: `${context.propsValue.text}`,
      username,
      profilePicture,
      threadTs: context.propsValue.threadTs
        ? processMessageTimestamp(context.propsValue.threadTs)
        : undefined,
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

    return {
      action: actionTextToIds.at(0) || 'N/A',
      payload: {
        type: 'action_blocks',
        user: {
          id: messageResponse.message?.user,
          username: 'user.name',
          name: 'john.smith',
          team_id: messageResponse.message?.team,
        },
        container: {
          type: 'message',
          message_ts: messageResponse.ts,
          channel_id: messageResponse.channel,
          is_ephemeral: false,
        },
        trigger_id: 'trigger_id',
        team: {
          id: messageResponse.message?.team,
          domain: 'team_name',
        },
        channel: {
          id: messageResponse.channel,
          name: '#channel',
        },
        message: messageResponse.message,
        state: {},
        actions: [
          {
            action_id: 'action_id',
            block_id: 'actions',
            value: 'resume_url',
            style: 'primary',
            type: 'button',
            action_ts: 'action_ts',
          },
        ],
      },
    };
  } else {
    const payloadQueryParams = context.resumePayload.queryParams as {
      action: string;
    };

    return {
      action: decodeURI(payloadQueryParams.action),
      payload: context.resumePayload.body,
    };
  }
};
