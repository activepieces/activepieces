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

const accountFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Account Name' },
  { key: 'accountName', label: 'Display Name' },
  { key: 'type', label: 'Account Type' },
  { key: 'role', label: 'Role' },
  { key: 'verificationState', label: 'Verification State' },
  { key: 'vettedState', label: 'Vetted State' },
];

const locationFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Location Name' },
  { key: 'title', label: 'Title' },
  { key: 'storeCode', label: 'Store Code' },
  { key: 'languageCode', label: 'Language Code' },
  { key: 'websiteUri', label: 'Website', format: 'url' },
  { key: 'labels', label: 'Labels' },
  {
    key: 'regularHours',
    label: 'Regular Hours',
    children: [
      {
        key: 'periods',
        label: 'Periods',
        listItems: [
          { key: 'openDay', label: 'Open Day' },
          { key: 'openTime', label: 'Open Time', children: [{ key: 'hours', label: 'Hours', format: 'number' }] },
          { key: 'closeDay', label: 'Close Day' },
          { key: 'closeTime', label: 'Close Time', children: [{ key: 'hours', label: 'Hours', format: 'number' }] },
        ],
      },
    ],
  },
  { key: 'phoneNumbers', label: 'Phone Numbers', children: [{ key: 'primaryPhone', label: 'Primary Phone' }] },
  {
    key: 'categories',
    label: 'Categories',
    children: [
      {
        key: 'primaryCategory',
        label: 'Primary Category',
        children: [
          { key: 'name', label: 'Category Id' },
          { key: 'displayName', label: 'Category' },
          {
            key: 'serviceTypes',
            label: 'Service Types',
            labelKey: 'displayName',
            listItems: [
              { key: 'serviceTypeId', label: 'Service Type Id' },
              { key: 'displayName', label: 'Service Type' },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'storefrontAddress',
    label: 'Address',
    children: [
      { key: 'regionCode', label: 'Region Code' },
      { key: 'languageCode', label: 'Language Code' },
      { key: 'addressLines', label: 'Address Lines' },
      { key: 'postalCode', label: 'Postal Code' },
      { key: 'administrativeArea', label: 'Administrative Area' },
      { key: 'locality', label: 'Locality' },
    ],
  },
  {
    key: 'latlng',
    label: 'Coordinates',
    children: [
      { key: 'latitude', label: 'Latitude', format: 'number' },
      { key: 'longitude', label: 'Longitude', format: 'number' },
    ],
  },
  { key: 'openInfo', label: 'Open Info', children: [
    { key: 'status', label: 'Status' },
    { key: 'canReopen', label: 'Can Reopen', format: 'boolean' },
  ] },
  {
    key: 'metadata',
    label: 'Metadata',
    children: [
      { key: 'placeId', label: 'Place Id' },
      { key: 'mapsUri', label: 'Maps URL', format: 'url' },
      { key: 'newReviewUri', label: 'New Review URL', format: 'url' },
      { key: 'hasVoiceOfMerchant', label: 'Has Voice Of Merchant', format: 'boolean' },
      { key: 'canDelete', label: 'Can Delete', format: 'boolean' },
      { key: 'canModifyServiceList', label: 'Can Modify Service List', format: 'boolean' },
    ],
  },
  { key: 'profile', label: 'Profile', children: [{ key: 'description', label: 'Description' }] },
];

const reviewFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Review Name' },
  { key: 'reviewId', label: 'Review Id' },
  { key: 'reviewReplyUrl', label: 'Review Reply URL', format: 'url' },
  {
    key: 'reviewer',
    label: 'Reviewer',
    children: [
      { key: 'displayName', label: 'Display Name' },
      { key: 'profilePhotoUrl', label: 'Profile Photo', format: 'url' },
    ],
  },
  { key: 'starRating', label: 'Star Rating' },
  { key: 'comment', label: 'Comment' },
  { key: 'createTime', label: 'Created At', format: 'datetime' },
  { key: 'updateTime', label: 'Updated At', format: 'datetime' },
  {
    key: 'reviewReply',
    label: 'Reply',
    children: [
      { key: 'comment', label: 'Reply Comment' },
      { key: 'updateTime', label: 'Reply Updated At', format: 'datetime' },
    ],
  },
];

const mediaFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Media Name' },
  { key: 'mediaFormat', label: 'Media Format' },
  { key: 'googleUrl', label: 'Google URL', format: 'url' },
  { key: 'thumbnailUrl', label: 'Thumbnail URL', format: 'url' },
  {
    key: 'dimensions',
    label: 'Dimensions',
    children: [
      { key: 'widthPixels', label: 'Width Pixels', format: 'number' },
      { key: 'heightPixels', label: 'Height Pixels', format: 'number' },
    ],
  },
  { key: 'createTime', label: 'Created At', format: 'datetime' },
  { key: 'description', label: 'Description' },
  { key: 'locationAssociation', label: 'Location Association', children: [{ key: 'category', label: 'Category' }] },
  { key: 'insights', label: 'Insights', children: [{ key: 'viewCount', label: 'View Count' }] },
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
export const listAccountsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'accounts', label: 'Accounts', labelKey: 'accountName', listItems: accountFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'next_page_token', label: 'Next Page Token' },
  ],
};
export const listLocationsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'locations', label: 'Locations', labelKey: 'title', listItems: locationFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'next_page_token', label: 'Next Page Token' },
  ],
};
export const getLocationActionOutputSchema: OutputSchema = { fields: locationFields };
export const updateLocationActionOutputSchema: OutputSchema = { fields: locationFields };
export const listReviewsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'reviews', label: 'Reviews', labelKey: 'comment', listItems: reviewFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'average_rating', label: 'Average Rating', format: 'number' },
    { key: 'total_review_count', label: 'Total Review Count', format: 'number' },
    { key: 'next_page_token', label: 'Next Page Token' },
  ],
};
export const getReviewActionOutputSchema: OutputSchema = { fields: reviewFields };
export const replyToReviewActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'comment', label: 'Reply Comment' },
    { key: 'updateTime', label: 'Updated At', format: 'datetime' },
  ],
};
export const deleteReviewReplyActionOutputSchema: OutputSchema = {
  fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};
export const getLocationVerificationStateActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'hasVoiceOfMerchant', label: 'Has Voice Of Merchant', format: 'boolean' },
    { key: 'hasBusinessAuthority', label: 'Has Business Authority', format: 'boolean' },
    {
      key: 'verify',
      label: 'Verify',
      children: [{ key: 'hasPendingVerification', label: 'Has Pending Verification', format: 'boolean' }],
    },
    {
      key: 'complyWithGuidelines',
      label: 'Comply With Guidelines',
      children: [{ key: 'recommendationReason', label: 'Recommendation Reason' }],
    },
  ],
};
export const listMediaActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'media_items', label: 'Media Items', labelKey: 'name', listItems: mediaFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total_media_item_count', label: 'Total Media Item Count', format: 'number' },
    { key: 'next_page_token', label: 'Next Page Token' },
  ],
};
export const getMediaActionOutputSchema: OutputSchema = { fields: mediaFields };
