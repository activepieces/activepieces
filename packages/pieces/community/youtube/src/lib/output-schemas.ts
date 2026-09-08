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


const videoItemFields: Fields = [
  { key: 'kind', label: 'Kind' },
  { key: 'etag', label: 'ETag' },
  { key: 'id', label: 'Video ID' },
  { key: 'snippet', label: 'Snippet', children: [
    { key: 'publishedAt', label: 'Published At', format: 'datetime' },
    { key: 'channelId', label: 'Channel ID' },
    { key: 'channelTitle', label: 'Channel Title' },
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'tags', label: 'Tags' },
    { key: 'categoryId', label: 'Category ID' },
    { key: 'liveBroadcastContent', label: 'Live Broadcast Content' },
    { key: 'defaultLanguage', label: 'Default Language' },
    { key: 'defaultAudioLanguage', label: 'Default Audio Language' },
    { key: 'localized', label: 'Localized', children: [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    ] },
    { key: 'thumbnails', label: 'Thumbnails', children: fullThumbnailSetFields },
  ] },
  { key: 'contentDetails', label: 'Content Details', children: [
    { key: 'duration', label: 'Duration (ISO 8601)' },
    { key: 'dimension', label: 'Dimension' },
    { key: 'definition', label: 'Definition' },
    { key: 'caption', label: 'Has Captions' },
    { key: 'licensedContent', label: 'Licensed Content', format: 'boolean' },
    { key: 'projection', label: 'Projection' },
  ] },
  { key: 'statistics', label: 'Statistics', children: [
    { key: 'viewCount', label: 'View Count' },
    { key: 'likeCount', label: 'Like Count' },
    { key: 'favoriteCount', label: 'Favorite Count' },
    { key: 'commentCount', label: 'Comment Count' },
  ] },
  { key: 'status', label: 'Status', children: [
    { key: 'uploadStatus', label: 'Upload Status' },
    { key: 'privacyStatus', label: 'Privacy Status' },
    { key: 'license', label: 'License' },
    { key: 'embeddable', label: 'Embeddable', format: 'boolean' },
    { key: 'publicStatsViewable', label: 'Public Stats Viewable', format: 'boolean' },
    { key: 'madeForKids', label: 'Made For Kids', format: 'boolean' },
  ] },
];

const channelItemFields: Fields = [
  { key: 'kind', label: 'Kind' },
  { key: 'etag', label: 'ETag' },
  { key: 'id', label: 'Channel ID' },
  { key: 'snippet', label: 'Snippet', children: [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'customUrl', label: 'Custom URL' },
    { key: 'publishedAt', label: 'Created At', format: 'datetime' },
    { key: 'country', label: 'Country' },
    { key: 'localized', label: 'Localized', children: [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    ] },
    { key: 'thumbnails', label: 'Thumbnails', children: basicThumbnailSetFields },
  ] },
  { key: 'statistics', label: 'Statistics', children: [
    { key: 'viewCount', label: 'View Count' },
    { key: 'subscriberCount', label: 'Subscriber Count' },
    { key: 'hiddenSubscriberCount', label: 'Hidden Subscriber Count', format: 'boolean' },
    { key: 'videoCount', label: 'Video Count' },
  ] },
  { key: 'contentDetails', label: 'Content Details', children: [
    { key: 'relatedPlaylists', label: 'Related Playlists', children: [
      { key: 'uploads', label: 'Uploads Playlist ID' },
      { key: 'likes', label: 'Likes Playlist ID' },
    ] },
  ] },
];

const playlistFields: Fields = [
  { key: 'kind', label: 'Kind' },
  { key: 'etag', label: 'ETag' },
  { key: 'id', label: 'Playlist ID' },
  { key: 'snippet', label: 'Snippet', children: [
    { key: 'publishedAt', label: 'Created At', format: 'datetime' },
    { key: 'channelId', label: 'Channel ID' },
    { key: 'channelTitle', label: 'Channel Title' },
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'localized', label: 'Localized', children: [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    ] },
    { key: 'thumbnails', label: 'Thumbnails', children: fullThumbnailSetFields },
  ] },
  { key: 'contentDetails', label: 'Content Details', children: [
    { key: 'itemCount', label: 'Item Count', format: 'number' },
  ] },
  { key: 'status', label: 'Status', children: [
    { key: 'privacyStatus', label: 'Privacy Status' },
  ] },
];

const commentSnippetFields: Fields = [
  { key: 'channelId', label: 'Channel ID' },
  { key: 'videoId', label: 'Video ID' },
  { key: 'textDisplay', label: 'Text (HTML)', format: 'html' },
  { key: 'textOriginal', label: 'Text' },
  { key: 'authorDisplayName', label: 'Author' },
  { key: 'authorProfileImageUrl', label: 'Author Avatar', format: 'url' },
  { key: 'authorChannelUrl', label: 'Author Channel URL', format: 'url' },
  { key: 'authorChannelId', label: 'Author Channel', children: [{ key: 'value', label: 'Channel ID' }] },
  { key: 'canRate', label: 'Can Rate', format: 'boolean' },
  { key: 'viewerRating', label: 'Viewer Rating' },
  { key: 'likeCount', label: 'Like Count', format: 'number' },
  { key: 'publishedAt', label: 'Published At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const commentResourceFields: Fields = [
  { key: 'kind', label: 'Kind' },
  { key: 'etag', label: 'ETag' },
  { key: 'id', label: 'Comment ID' },
  { key: 'snippet', label: 'Snippet', children: commentSnippetFields },
];

const commentThreadFields: Fields = [
  { key: 'kind', label: 'Kind' },
  { key: 'etag', label: 'ETag' },
  { key: 'id', label: 'Thread ID' },
  { key: 'snippet', label: 'Snippet', children: [
    { key: 'channelId', label: 'Channel ID' },
    { key: 'videoId', label: 'Video ID' },
    { key: 'canReply', label: 'Can Reply', format: 'boolean' },
    { key: 'isPublic', label: 'Is Public', format: 'boolean' },
    { key: 'totalReplyCount', label: 'Reply Count', format: 'number' },
    { key: 'topLevelComment', label: 'Top Level Comment', children: commentResourceFields },
  ] },
  { key: 'replies', label: 'Replies', children: [
    { key: 'comments', label: 'Comments', listItems: commentResourceFields, labelKey: 'id' },
  ] },
];

const listEnvelope = ({
  label,
  itemFields,
  itemLabelKey,
  withPageInfo = true,
  withNextPageToken = true,
  withPrevPageToken = true,
  withRegionCode = false,
}: {
  label: string;
  itemFields: Fields;
  itemLabelKey: string;
  withPageInfo?: boolean;
  withNextPageToken?: boolean;
  withPrevPageToken?: boolean;
  withRegionCode?: boolean;
}): OutputSchema => ({
  fields: [
    { key: 'kind', label: 'Kind' },
    { key: 'etag', label: 'ETag' },
    ...(withNextPageToken ? [{ key: 'nextPageToken', label: 'Next Page Token' }] : []),
    ...(withPrevPageToken ? [{ key: 'prevPageToken', label: 'Previous Page Token' }] : []),
    ...(withRegionCode ? [{ key: 'regionCode', label: 'Region Code' }] : []),
    ...(withPageInfo ? [{ key: 'pageInfo', label: 'Page Info', children: pageInfoFields }] : []),
    { key: 'items', label, listItems: itemFields, labelKey: itemLabelKey },
  ],
});



export const newVideoTriggerOutputSchema: OutputSchema = { fields: newVideoTriggerFields };

export const searchOutputSchema: OutputSchema = listEnvelope({
  label: 'Results',
  itemFields: searchItemFields,
  itemLabelKey: 'etag',
  withRegionCode: true,
});

export const listPlaylistItemsOutputSchema: OutputSchema = listEnvelope({
  label: 'Playlist Items',
  itemFields: playlistItemFields,
  itemLabelKey: 'id',
});

export const listCaptionsOutputSchema: OutputSchema = listEnvelope({
  label: 'Captions',
  itemFields: captionItemFields,
  itemLabelKey: 'id',
  withPageInfo: false,
  withNextPageToken: false,
  withPrevPageToken: false,
});

export const getVideoOutputSchema: OutputSchema = listEnvelope({
  label: 'Videos',
  itemFields: videoItemFields,
  itemLabelKey: 'id',
  withNextPageToken: false,
  withPrevPageToken: false,
});

export const getChannelOutputSchema: OutputSchema = listEnvelope({
  label: 'Channels',
  itemFields: channelItemFields,
  itemLabelKey: 'id',
  withNextPageToken: false,
  withPrevPageToken: false,
});

export const listPlaylistsOutputSchema: OutputSchema = listEnvelope({
  label: 'Playlists',
  itemFields: playlistFields,
  itemLabelKey: 'id',
});

export const listCommentsOutputSchema: OutputSchema = listEnvelope({
  label: 'Comment Threads',
  itemFields: commentThreadFields,
  itemLabelKey: 'id',
  withPrevPageToken: false,
});
