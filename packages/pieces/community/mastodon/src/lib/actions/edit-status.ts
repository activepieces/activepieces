import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import {
  MastodonConnection,
  MastodonEntity,
  mastodonClient,
  mastodonProps,
  mastodonUtils,
} from '../common/client';
import { statusOutputSchema } from '../output-schemas';

const POLL_MIN_REMAINING_MS = (5 * 60 + 60) * 1000;

export const editStatus = createAction({
  auth: mastodonAuth,
  name: 'edit_status',
  classification: 'WRITE',
  displayName: 'Edit Status',
  description: 'Edit the text, content warning, media, language or poll of your status.',
  audience: 'both',
  aiMetadata: {
    description:
      'Edits a status posted by the connected account; only the fields you set change, everything else (text, content warning, sensitivity, media, poll) is carried over from the current post. An existing poll keeps its votes when you leave the poll fields empty, but its hidden-totals setting is reset to visible, and the edit is refused if the poll has ended or closes in under 5 minutes. Setting Poll Options or Allow Multiple Choices to different values resets all votes. Media IDs replace the attached media set. It cannot remove an existing content warning or detach all media; to do that, delete the status and create it again.',
    idempotent: true,
  },
  outputSchema: statusOutputSchema,
  propertyGroups: [
    {
      key: 'target',
      display: 'section',
      label: 'Status to Edit',
      icon: 'tag',
      props: ['status_id'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'text',
      props: ['edit_info', 'status', 'spoiler_text', 'language'],
    },
    {
      key: 'media',
      display: 'section',
      label: 'Media',
      icon: 'paperclip',
      props: ['media_ids', 'sensitive'],
    },
    {
      key: 'poll',
      display: 'section',
      label: 'Poll',
      icon: 'sliders',
      props: ['poll_options', 'poll_expires_in', 'poll_multiple'],
    },
  ],
  props: {
    status_id: Property.ShortText({
      displayName: 'Status ID',
      description: 'ID of one of your own statuses, for example from Post Status.',
      placeholder: '109372843234737004',
      required: true,
    }),
    edit_info: Property.MarkDown({
      value: 'Fields left empty, here and below, keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    status: Property.LongText({
      displayName: 'Status Text',
      description: 'New text of the status.',
      required: false,
    }),
    spoiler_text: Property.ShortText({
      displayName: 'Content Warning',
      description: 'New content warning. An existing one cannot be removed here.',
      placeholder: 'Spoilers ahead',
      required: false,
      width: 'half',
    }),
    sensitive: mastodonProps.optionalBoolean({
      displayName: 'Mark Media as Sensitive',
      description: 'Hide the media behind a warning.',
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Two-letter ISO 639-1 language code.',
      placeholder: 'en',
      required: false,
      width: 'half',
    }),
    media_ids: Property.Array({
      displayName: 'Media IDs',
      description: 'Replaces the attached media. All media cannot be removed here.',
      required: false,
    }),
    poll_options: Property.Array({
      displayName: 'Poll Options',
      description: 'New choices, one per item. Changing them resets all votes.',
      required: false,
    }),
    poll_expires_in: Property.Number({
      displayName: 'Poll Duration',
      description:
        'Seconds the poll stays open: 300 (5 minutes) to 2629746 (1 month).',
      required: false,
    }),
    poll_multiple: mastodonProps.optionalBoolean({
      displayName: 'Allow Multiple Choices',
      description: 'Changing this resets all votes.',
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const auth = context.auth.props;
    const statusPath = `/api/v1/statuses/${encodeURIComponent(props.status_id)}`;

    const source = await mastodonClient.request<StatusSource>({
      auth,
      method: HttpMethod.GET,
      path: `${statusPath}/source`,
      operation: 'Edit Status (read current source)',
      scope: 'read:statuses',
    });
    const current = await mastodonClient.request<StatusForEdit>({
      auth,
      method: HttpMethod.GET,
      path: statusPath,
      operation: 'Edit Status (read current status)',
      scope: 'read:statuses',
    });

    const callerMediaIds = mastodonUtils.toStringArray(props.media_ids);
    const mediaIds =
      callerMediaIds ?? (current.media_attachments ?? []).map((attachment) => attachment.id);
    const poll = resolvePoll({
      current: current.poll,
      options: mastodonUtils.toStringArray(props.poll_options),
      expiresIn: props.poll_expires_in,
      multiple: props.poll_multiple,
    });
    if (poll !== undefined && mediaIds.length > 0) {
      throw new Error(
        'A status cannot have both media and a poll. Remove the Media IDs or the poll fields.'
      );
    }

    const body = {
      status: mastodonUtils.hasValue(props.status) ? props.status : source.text,
      spoiler_text: mastodonUtils.hasValue(props.spoiler_text)
        ? props.spoiler_text
        : source.spoiler_text,
      sensitive: props.sensitive ?? current.sensitive,
      media_ids: mediaIds,
      ...(mastodonUtils.hasValue(props.language) ? { language: props.language } : {}),
      ...(poll !== undefined ? { poll } : {}),
    };

    return sendEdit({ auth, statusPath, body });
  },
});

function resolvePoll({
  current,
  options,
  expiresIn,
  multiple,
}: {
  current: CurrentPoll | null | undefined;
  options: string[] | undefined;
  expiresIn: number | null | undefined;
  multiple: boolean | undefined;
}): PollPayload | undefined {
  const callerExpiresIn = expiresIn === null ? undefined : expiresIn;
  const callerSetPoll =
    options !== undefined || callerExpiresIn !== undefined || multiple !== undefined;
  const hasCurrentPoll = current !== undefined && current !== null;

  if (!callerSetPoll) {
    if (!hasCurrentPoll) {
      return undefined;
    }
    return {
      options: current.options.map((option) => option.title),
      expires_in: remainingPollSeconds({ poll: current }),
      multiple: current.multiple,
    };
  }

  const resolvedOptions =
    options ?? (hasCurrentPoll ? current.options.map((option) => option.title) : undefined);
  if (resolvedOptions === undefined) {
    throw new Error(
      'This status has no poll. Provide Poll Options and Poll Duration to add one.'
    );
  }
  const resolvedExpiresIn =
    callerExpiresIn ??
    (hasCurrentPoll ? remainingPollSeconds({ poll: current }) : undefined);
  if (resolvedExpiresIn === undefined) {
    throw new Error('Poll Duration is required when adding a poll.');
  }
  return {
    options: resolvedOptions,
    expires_in: resolvedExpiresIn,
    multiple: multiple ?? (hasCurrentPoll ? current.multiple : false),
  };
}

function remainingPollSeconds({ poll }: { poll: CurrentPoll }): number {
  const expiresAt = poll.expires_at === null ? Number.NaN : new Date(poll.expires_at).getTime();
  const remainingMs = expiresAt - Date.now();
  if (poll.expired || Number.isNaN(expiresAt) || remainingMs < POLL_MIN_REMAINING_MS) {
    throw new Error(
      'This status has a poll that has ended or closes within 6 minutes. Mastodon re-checks the poll on every edit (5 minutes to 1 month), so the edit would fail or remove the poll. Nothing was changed.'
    );
  }
  return Math.floor(remainingMs / 1000);
}

async function sendEdit({
  auth,
  statusPath,
  body,
}: {
  auth: MastodonConnection;
  statusPath: string;
  body: Record<string, unknown>;
}): Promise<MastodonEntity> {
  return mastodonClient.request<MastodonEntity>({
    auth,
    method: HttpMethod.PUT,
    path: statusPath,
    operation: 'Edit Status',
    scope: 'write:statuses',
    body,
  });
}

type StatusSource = {
  text: string;
  spoiler_text: string;
};

type CurrentPoll = {
  expires_at: string | null;
  expired: boolean;
  multiple: boolean;
  options: { title: string }[];
};

type StatusForEdit = {
  sensitive: boolean;
  media_attachments?: { id: string }[];
  poll?: CurrentPoll | null;
};

type PollPayload = {
  options: string[];
  expires_in: number;
  multiple: boolean;
};
