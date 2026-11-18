import { OutputSchema } from '@activepieces/pieces-framework';

export const sendItOutputSchemas = {
  publishResult: publishResult(),
  scheduleResult: scheduleResult(),
  triggerNowResult: triggerNowResult(),
  cancelResult: cancelResult(),
  validationResult: validationResult(),
  accountList: accountList(),
  scheduledList: scheduledList(),
  scheduledPost: scheduledPost(),
  requirements: requirements(),
  analytics: analytics(),
  deadLetterList: deadLetterList(),
  postPublishedEvent: postPublishedEvent(),
  postFailedEvent: postFailedEvent(),
  postScheduledEvent: postScheduledEvent(),
};

function contentFields(): Fields {
  return [
    { key: 'text', label: 'Text' },
    { key: 'mediaUrl', label: 'Media URL', format: 'url' },
    { key: 'mediaUrls', label: 'Media URLs' },
  ];
}

function accountFields(): Fields {
  return [
    { key: 'id', label: 'Account ID' },
    { key: 'platform', label: 'Platform' },
    { key: 'username', label: 'Username' },
    { key: 'platformUserId', label: 'Platform User ID' },
    { key: 'connectedAt', label: 'Connected At', format: 'datetime' },
  ];
}

function scheduledPostFields(): Fields {
  return [
    { key: 'id', label: 'Schedule ID' },
    { key: 'platforms', label: 'Platforms' },
    { key: 'content', label: 'Content', children: contentFields() },
    { key: 'scheduledTime', label: 'Scheduled Time', format: 'datetime' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
  ];
}

function publishResultFields(): Fields {
  return [
    { key: 'platform', label: 'Platform' },
    { key: 'platformPostId', label: 'Platform Post ID', description: 'The post ID on the platform (e.g. a Bluesky at:// URI).' },
    { key: 'postUrl', label: 'Post URL', format: 'url' },
    { key: 'postType', label: 'Post Type' },
  ];
}

function publishResult(): OutputSchema {
  return {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'results', label: 'Per-Platform Results', listItems: publishResultFields(), labelKey: 'platform' },
      { key: 'errors', label: 'Errors' },
      { key: 'errorDetails', label: 'Error Details' },
      { key: 'idempotencyKey', label: 'Idempotency Key', description: 'Key sent as the Idempotency-Key header.' },
    ],
  };
}

function scheduleResult(): OutputSchema {
  return {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'scheduleId', label: 'Schedule ID', description: 'Pass to Cancel or Publish Scheduled Post Now.' },
      { key: 'platforms', label: 'Platforms' },
      { key: 'scheduledTime', label: 'Scheduled Time', format: 'datetime' },
      { key: 'status', label: 'Status' },
      { key: 'idempotencyKey', label: 'Idempotency Key' },
    ],
  };
}

function triggerNowResult(): OutputSchema {
  return {
    fields: [
      { key: 'scheduleId', label: 'Schedule ID' },
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'results', label: 'Per-Platform Results', listItems: publishResultFields(), labelKey: 'platform' },
      { key: 'errors', label: 'Errors' },
      { key: 'errorDetails', label: 'Error Details' },
    ],
  };
}

function cancelResult(): OutputSchema {
  return {
    fields: [
      { key: 'scheduleId', label: 'Schedule ID' },
      { key: 'cancelled', label: 'Cancelled', format: 'boolean' },
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'message', label: 'Message' },
    ],
  };
}

function validationResult(): OutputSchema {
  return {
    fields: [
      { key: 'valid', label: 'Valid', format: 'boolean' },
      {
        key: 'errors',
        label: 'Errors',
        labelKey: 'message',
        listItems: [
          { key: 'platform', label: 'Platform' },
          { key: 'field', label: 'Field' },
          { key: 'message', label: 'Message' },
        ],
      },
      { key: 'warnings', label: 'Warnings' },
      { key: 'platformLimits', label: 'Platform Limits', description: 'Object keyed by platform: name, textLimit, mediaRequired, maxImages, maxMediaItems, videoOnly, textOnly.' },
    ],
  };
}

function accountList(): OutputSchema {
  return {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'accounts', label: 'Accounts', listItems: accountFields(), labelKey: 'username' },
      { key: 'count', label: 'Count (this response)', format: 'number' },
    ],
  };
}

function scheduledList(): OutputSchema {
  return {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'posts', label: 'Scheduled Posts', listItems: scheduledPostFields(), labelKey: 'id' },
      { key: 'count', label: 'Count (this response)', format: 'number' },
    ],
  };
}

function scheduledPost(): OutputSchema {
  return { fields: scheduledPostFields() };
}

function requirements(): OutputSchema {
  return {
    fields: [
      { key: 'platform', label: 'Platform' },
      { key: 'name', label: 'Platform Name' },
      { key: 'textLimit', label: 'Text Limit', format: 'number' },
      { key: 'hashtagLimit', label: 'Hashtag Limit', format: 'number' },
      { key: 'accountTypes', label: 'Supported Account Types' },
      { key: 'imageFormats', label: 'Image Formats' },
      { key: 'imageSize', label: 'Max Image Size' },
      { key: 'maxImages', label: 'Max Images', format: 'number' },
      { key: 'videoFormats', label: 'Video Formats' },
      { key: 'videoDuration', label: 'Max Video Duration' },
      { key: 'videoSize', label: 'Max Video Size' },
      { key: 'rateLimit', label: 'Rate Limit' },
      { key: 'tokenExpiry', label: 'Token Expiry' },
      { key: 'notes', label: 'Notes' },
    ],
  };
}

function analytics(): OutputSchema {
  return {
    fields: [
      { key: 'platform', label: 'Platform' },
      { key: 'posts', label: 'Posts', description: 'Per-post metrics as returned by SendIt for this platform.' },
      { key: 'count', label: 'Count (this response)', format: 'number' },
    ],
  };
}

function deadLetterList(): OutputSchema {
  return {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      {
        key: 'posts',
        label: 'Failed Posts',
        labelKey: 'id',
        listItems: [
          { key: 'id', label: 'ID' },
          { key: 'scheduleId', label: 'Schedule ID' },
          { key: 'platforms', label: 'Platforms' },
          { key: 'content', label: 'Content', children: contentFields() },
          { key: 'error', label: 'Error' },
          { key: 'retryCount', label: 'Retry Count', format: 'number' },
          { key: 'status', label: 'Status' },
        ],
      },
      { key: 'count', label: 'Count (this response)', format: 'number' },
    ],
  };
}

function triggerBase(): Fields {
  return [
    { key: 'delivery_id', label: 'Delivery ID' },
    { key: 'event', label: 'Event' },
    { key: 'timestamp', label: 'Delivered At', format: 'datetime' },
    { key: 'content_text', label: 'Post Text' },
  ];
}

function postPublishedEvent(): OutputSchema {
  return {
    fields: [
      ...triggerBase(),
      { key: 'platform', label: 'Platform' },
      { key: 'post_id', label: 'Post ID', description: 'As sent by SendIt; for Bluesky this is the post URL.' },
      { key: 'post_url', label: 'Post URL', format: 'url' },
      { key: 'published_at', label: 'Published At', format: 'datetime' },
    ],
  };
}

function postFailedEvent(): OutputSchema {
  return {
    fields: [
      ...triggerBase(),
      { key: 'platform', label: 'Platform' },
      { key: 'error', label: 'Error' },
      { key: 'failed_at', label: 'Failed At', format: 'datetime' },
    ],
  };
}

function postScheduledEvent(): OutputSchema {
  return {
    fields: [
      ...triggerBase(),
      { key: 'schedule_id', label: 'Schedule ID' },
      { key: 'platforms', label: 'Platforms' },
      { key: 'scheduled_time', label: 'Scheduled Time', format: 'datetime' },
    ],
  };
}

type Fields = OutputSchema['fields'];
