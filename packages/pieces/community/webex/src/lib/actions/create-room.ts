import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const createRoom = createAction({
  name: 'createRoom',
  displayName: 'Create Room',
  description:
    'Create a new Webex room (space). The authenticated user is automatically added as a member.',
  props: {
    title: Property.ShortText({
      displayName: 'Room Title',
      description: 'A user-friendly name for the room',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the room. Required if isPublic is true.',
      required: false,
    }),
    teamId: Property.ShortText({
      displayName: 'Team ID',
      description:
        'The ID for the team with which this room is associated (optional)',
      required: false,
    }),
    classificationId: Property.ShortText({
      displayName: 'Classification ID',
      description: 'The classificationId for the room (optional)',
      required: false,
    }),
    isPublic: Property.Checkbox({
      displayName: 'Public Room',
      description:
        'Make the room public and discoverable within the org. Note: description is required if this is true.',
      required: false,
    }),
    isLocked: Property.Checkbox({
      displayName: 'Locked/Moderated',
      description:
        'Set the space as locked/moderated. The creator becomes a moderator.',
      required: false,
    }),
    isAnnouncementOnly: Property.Checkbox({
      displayName: 'Announcement Only',
      description:
        'Sets the space into announcement mode. Only moderators can post messages. Note: space must be locked (moderated) to enable this.',
      required: false,
    }),
  },
  async run(context) {
    const {
      title,
      description,
      teamId,
      classificationId,
      isPublic,
      isLocked,
      isAnnouncementOnly,
    } = context.propsValue;
    if (isPublic && !description) {
      throw new Error('Description is required for public rooms');
    }

    if (isAnnouncementOnly && !isLocked) {
      throw new Error(
        'Room must be locked/moderated to enable announcement-only mode'
      );
    }

    const body: Record<string, unknown> = {
      title,
    };

    if (description) {
      body['description'] = description;
    }

    if (teamId) {
      body['teamId'] = teamId;
    }

    if (classificationId) {
      body['classificationId'] = classificationId;
    }

    if (isPublic !== undefined && isPublic) {
      body['isPublic'] = isPublic;
    }

    if (isLocked !== undefined && isLocked) {
      body['isLocked'] = isLocked;
    }

    if (isAnnouncementOnly !== undefined && isAnnouncementOnly) {
      body['isAnnouncementOnly'] = isAnnouncementOnly;
    }

    const response = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      '/rooms',
      body
    );

    return response;
  },
});
