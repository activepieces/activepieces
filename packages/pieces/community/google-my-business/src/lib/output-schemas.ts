import { OutputSchema } from '@activepieces/pieces-framework';

const googleDateFields: OutputSchema['fields'] = [
  { key: 'year', label: 'Year', format: 'number' },
  { key: 'month', label: 'Month', format: 'number' },
  { key: 'day', label: 'Day', format: 'number' },
];

const googleTimeFields: OutputSchema['fields'] = [
  { key: 'hours', label: 'Hours', format: 'number' },
  { key: 'minutes', label: 'Minutes', format: 'number' },
];

const localPostFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Post Name' },
  { key: 'summary', label: 'Summary' },
  { key: 'topicType', label: 'Post Type' },
  { key: 'alertType', label: 'Alert Type' },
  { key: 'state', label: 'State' },
  { key: 'languageCode', label: 'Language Code' },
  { key: 'scheduledTime', label: 'Publish At', format: 'datetime' },
  { key: 'createTime', label: 'Created At', format: 'datetime' },
  { key: 'updateTime', label: 'Updated At', format: 'datetime' },
  {
    key: 'callToAction',
    label: 'Call To Action',
    children: [
      { key: 'actionType', label: 'Action Type' },
      { key: 'url', label: 'URL', format: 'url' },
    ],
  },
  {
    key: 'event',
    label: 'Event',
    children: [
      { key: 'title', label: 'Title' },
      {
        key: 'schedule',
        label: 'Schedule',
        children: [
          { key: 'startDate', label: 'Start Date', children: googleDateFields },
          { key: 'startTime', label: 'Start Time', children: googleTimeFields },
          { key: 'endDate', label: 'End Date', children: googleDateFields },
          { key: 'endTime', label: 'End Time', children: googleTimeFields },
        ],
      },
    ],
  },
  {
    key: 'media',
    label: 'Media',
    labelKey: 'name',
    listItems: [
      { key: 'name', label: 'Media Name' },
      { key: 'mediaFormat', label: 'Media Format' },
      { key: 'googleUrl', label: 'Google URL', format: 'url' },
    ],
  },
];

export const createPostActionOutputSchema: OutputSchema = { fields: localPostFields };
export const getPostActionOutputSchema: OutputSchema = { fields: localPostFields };
export const updatePostActionOutputSchema: OutputSchema = { fields: localPostFields };
export const listPostsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'localPosts', label: 'Posts', labelKey: 'summary', listItems: localPostFields },
    { key: 'nextPageToken', label: 'Next Page Token' },
  ],
};
