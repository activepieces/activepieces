import { Property } from '@activepieces/pieces-framework';

export const aiProps = { scheduleId, platform };

function scheduleId() {
  return Property.ShortText({
    displayName: 'Schedule ID',
    description: 'The schedule ID returned by Schedule Post or listed by List Scheduled Posts (field id).',
    required: true,
  });
}

function platform() {
  return Property.ShortText({
    displayName: 'Platform',
    description: 'Lowercase SendIt platform value, e.g. x, linkedin, instagram, threads, bluesky, tiktok, youtube, telegram, discord.',
    required: true,
  });
}
