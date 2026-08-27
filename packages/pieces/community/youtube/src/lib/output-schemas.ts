import { OutputSchema } from '@activepieces/pieces-framework';

type Fields = OutputSchema['fields'];

const xmlTextNodeFields: Fields = [{ key: '#', label: 'Value' }];

const newVideoTriggerFields: Fields = [
  { key: 'title', label: 'Title' },
  { key: 'link', label: 'Video URL', format: 'url' },
  { key: 'guid', label: 'GUID' },
  { key: 'author', label: 'Channel Name' },
  { key: 'date', label: 'Date', format: 'datetime' },
  { key: 'pubdate', label: 'Published At', format: 'datetime' },
  { key: 'pubDate', label: 'Published At (alias)', format: 'datetime' },
  {
    key: 'image',
    label: 'Image',
    children: [{ key: 'url', label: 'Image URL', format: 'url' }],
  },
  { key: 'yt:videoid', label: 'Video ID', children: xmlTextNodeFields },
  { key: 'yt:channelid', label: 'Channel ID', children: xmlTextNodeFields },
  { key: 'atom:title', label: 'Atom Title', children: xmlTextNodeFields },
  { key: 'atom:id', label: 'Atom ID', children: xmlTextNodeFields },
  { key: 'atom:published', label: 'Atom Published At', children: xmlTextNodeFields },
  { key: 'atom:updated', label: 'Atom Updated At', children: xmlTextNodeFields },
  {
    key: 'media:group',
    label: 'Media',
    children: [
      { key: 'media:title', label: 'Media Title', children: xmlTextNodeFields },
      { key: 'media:description', label: 'Media Description', children: xmlTextNodeFields },
      {
        key: 'media:thumbnail',
        label: 'Thumbnail',
        children: [
          {
            key: '@',
            label: 'Attributes',
            children: [
              { key: 'url', label: 'Thumbnail URL', format: 'url' },
              { key: 'width', label: 'Width' },
              { key: 'height', label: 'Height' },
            ],
          },
        ],
      },
      {
        key: 'media:content',
        label: 'Content',
        children: [
          {
            key: '@',
            label: 'Attributes',
            children: [
              { key: 'url', label: 'Content URL', format: 'url' },
              { key: 'type', label: 'MIME Type' },
              { key: 'width', label: 'Width' },
              { key: 'height', label: 'Height' },
            ],
          },
        ],
      },
      {
        key: 'media:community',
        label: 'Community Stats',
        children: [
          {
            key: 'media:starrating',
            label: 'Star Rating',
            children: [
              {
                key: '@',
                label: 'Attributes',
                children: [
                  { key: 'count', label: 'Rating Count' },
                  { key: 'average', label: 'Average Rating' },
                  { key: 'min', label: 'Minimum' },
                  { key: 'max', label: 'Maximum' },
                ],
              },
            ],
          },
          {
            key: 'media:statistics',
            label: 'Statistics',
            children: [
              {
                key: '@',
                label: 'Attributes',
                children: [{ key: 'views', label: 'Views' }],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'meta',
    label: 'Channel',
    children: [
      { key: 'title', label: 'Channel Title' },
      { key: 'link', label: 'Channel URL', format: 'url' },
      { key: 'author', label: 'Channel Author' },
      { key: 'xmlurl', label: 'Feed URL', format: 'url' },
      { key: 'pubdate', label: 'Channel Created At', format: 'datetime' },
    ],
  },
  { key: '_dedupe_key', label: 'Deduplication Key' },
];

const thumbnailFields: Fields = [
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'width', label: 'Width', format: 'number' },
  { key: 'height', label: 'Height', format: 'number' },
];

const basicThumbnailSetFields: Fields = [
  { key: 'default', label: 'Default', children: thumbnailFields },
  { key: 'medium', label: 'Medium', children: thumbnailFields },
  { key: 'high', label: 'High', children: thumbnailFields },
];

const fullThumbnailSetFields: Fields = [
  ...basicThumbnailSetFields,
  { key: 'standard', label: 'Standard', children: thumbnailFields },
  { key: 'maxres', label: 'Max Resolution', children: thumbnailFields },
];

const pageInfoFields: Fields = [
  { key: 'totalResults', label: 'Total Results', format: 'number' },
  { key: 'resultsPerPage', label: 'Results Per Page', format: 'number' },
];

const searchItemFields: Fields = [
  { key: 'kind', label: 'Kind' },
  { key: 'etag', label: 'ETag' },
  { key: 'id', label: 'ID', children: [
    { key: 'kind', label: 'Resource Kind' },
    { key: 'videoId', label: 'Video ID' },
    { key: 'channelId', label: 'Channel ID' },
    { key: 'playlistId', label: 'Playlist ID' },
  ] },
  { key: 'snippet', label: 'Snippet', children: [
    { key: 'publishedAt', label: 'Published At', format: 'datetime' },
    { key: 'publishTime', label: 'Publish Time', format: 'datetime' },
    { key: 'channelId', label: 'Channel ID' },
    { key: 'channelTitle', label: 'Channel Title' },
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'liveBroadcastContent', label: 'Live Broadcast Content' },
    { key: 'thumbnails', label: 'Thumbnails', children: basicThumbnailSetFields },
  ] },
];

const playlistItemFields: Fields = [
  { key: 'kind', label: 'Kind' },
  { key: 'etag', label: 'ETag' },
  { key: 'id', label: 'Playlist Item ID' },
  { key: 'snippet', label: 'Snippet', children: [
    { key: 'publishedAt', label: 'Added At', format: 'datetime' },
    { key: 'channelId', label: 'Channel ID' },
    { key: 'channelTitle', label: 'Channel Title' },
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'playlistId', label: 'Playlist ID' },
    { key: 'position', label: 'Position', format: 'number' },
    { key: 'videoOwnerChannelTitle', label: 'Video Owner Channel Title' },
    { key: 'videoOwnerChannelId', label: 'Video Owner Channel ID' },
    { key: 'resourceId', label: 'Resource', children: [
      { key: 'kind', label: 'Resource Kind' },
      { key: 'videoId', label: 'Video ID' },
    ] },
    { key: 'thumbnails', label: 'Thumbnails', children: fullThumbnailSetFields },
  ] },
  { key: 'contentDetails', label: 'Content Details', children: [
    { key: 'videoId', label: 'Video ID' },
    { key: 'videoPublishedAt', label: 'Video Published At', format: 'datetime' },
  ] },
  { key: 'status', label: 'Status', children: [
    { key: 'privacyStatus', label: 'Privacy Status' },
  ] },
];

const captionItemFields: Fields = [
  { key: 'kind', label: 'Kind' },
  { key: 'etag', label: 'ETag' },
  { key: 'id', label: 'Caption ID' },
  { key: 'snippet', label: 'Snippet', children: [
    { key: 'videoId', label: 'Video ID' },
    { key: 'lastUpdated', label: 'Last Updated', format: 'datetime' },
    { key: 'trackKind', label: 'Track Kind' },
    { key: 'language', label: 'Language' },
    { key: 'name', label: 'Name' },
    { key: 'audioTrackType', label: 'Audio Track Type' },
    { key: 'isCC', label: 'Closed Captions', format: 'boolean' },
    { key: 'isLarge', label: 'Large Text', format: 'boolean' },
    { key: 'isEasyReader', label: 'Easy Reader', format: 'boolean' },
    { key: 'isDraft', label: 'Draft', format: 'boolean' },
    { key: 'isAutoSynced', label: 'Auto Synced', format: 'boolean' },
    { key: 'status', label: 'Status' },
  ] },
];

const pagedEnvelope = (label: string, itemFields: Fields, itemLabelKey: string, withRegionCode: boolean): OutputSchema => ({
  fields: [
    { key: 'kind', label: 'Kind' },
    { key: 'etag', label: 'ETag' },
    { key: 'nextPageToken', label: 'Next Page Token' },
    { key: 'prevPageToken', label: 'Previous Page Token' },
    ...(withRegionCode ? [{ key: 'regionCode', label: 'Region Code' }] : []),
    { key: 'pageInfo', label: 'Page Info', children: pageInfoFields },
    { key: 'items', label, listItems: itemFields, labelKey: itemLabelKey },
  ],
});

const plainEnvelope = (label: string, itemFields: Fields, itemLabelKey: string): OutputSchema => ({
  fields: [
    { key: 'kind', label: 'Kind' },
    { key: 'etag', label: 'ETag' },
    { key: 'items', label, listItems: itemFields, labelKey: itemLabelKey },
  ],
});

export const newVideoTriggerOutputSchema: OutputSchema = { fields: newVideoTriggerFields };

export const searchOutputSchema: OutputSchema = pagedEnvelope('Results', searchItemFields, 'etag', true);
export const listPlaylistItemsOutputSchema: OutputSchema = pagedEnvelope('Playlist Items', playlistItemFields, 'id', false);
export const listCaptionsOutputSchema: OutputSchema = plainEnvelope('Captions', captionItemFields, 'id');
