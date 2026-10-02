import { OutputSchema } from '@activepieces/pieces-framework';

export const supadataGetAccountOutputSchema: OutputSchema = {
  fields: [
    { key: 'organizationId', label: 'Organization ID' },
    { key: 'plan', label: 'Plan' },
    { key: 'maxCredits', label: 'Max Credits', format: 'number' },
    { key: 'usedCredits', label: 'Used Credits', format: 'number' },
  ],
};

export const supadataGetYoutubeChannelOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'handle', label: 'Handle' },
    { key: 'thumbnail', label: 'Thumbnail', format: 'image' },
    { key: 'banner', label: 'Banner', format: 'url' },
    { key: 'subscriberCount', label: 'Subscriber Count', format: 'number' },
    { key: 'videoCount', label: 'Video Count', format: 'number' },
    { key: 'viewCount', label: 'View Count', format: 'number' },
  ],
};

export const supadataListYoutubeChannelVideosOutputSchema: OutputSchema = {
  fields: [
    { key: 'videoIds', label: 'Video IDs' },
    { key: 'shortIds', label: 'Short IDs' },
    { key: 'liveIds', label: 'Live IDs' },
  ],
};

export const supadataStartVideoExtractionOutputSchema: OutputSchema = {
  fields: [
    { key: 'jobId', label: 'Job ID' },
  ],
};

export const supadataGetVideoExtractionResultOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status' },
    { key: 'data', label: 'Extracted Data', dynamicKey: true },
  ],
};

export const getTranscriptOutputSchema: OutputSchema = {
  fields: [
    { key: 'content', label: 'Content' },
    { key: 'lang', label: 'Language' },
    { key: 'availableLangs', label: 'Available Languages' },
  ],
};

export const supadataMapWebsiteOutputSchema: OutputSchema = {
  fields: [
    { key: 'urls', label: 'URLs' },
  ],
};

export const supadataGetMediaMetadataOutputSchema: OutputSchema = {
  fields: [
    { key: 'platform', label: 'Platform' },
    { key: 'type', label: 'Type' },
    { key: 'id', label: 'ID' },
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    {
      key: 'author',
      label: 'Author',
      children: [
        { key: 'displayName', label: 'Display Name' },
      ],
    },
    {
      key: 'stats',
      label: 'Stats',
      children: [
        { key: 'views', label: 'Views', format: 'number' },
        { key: 'likes', label: 'Likes', format: 'number' },
        { key: 'comments', label: 'Comments', format: 'number' },
        { key: 'shares', label: 'Shares', format: 'number' },
      ],
    },
    {
      key: 'media',
      label: 'Media',
      children: [
        { key: 'type', label: 'Type' },
        { key: 'duration', label: 'Duration', format: 'number' },
        { key: 'thumbnailUrl', label: 'Thumbnail URL', format: 'image' },
      ],
    },
    { key: 'tags', label: 'Tags' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    {
      key: 'additionalData',
      label: 'Additional Data',
      children: [
        { key: 'channelId', label: 'Channel ID' },
      ],
    },
  ],
};

export const supadataGetYoutubePlaylistOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'videoCount', label: 'Video Count', format: 'number' },
    { key: 'viewCount', label: 'View Count', format: 'number' },
    { key: 'lastUpdated', label: 'Last Updated', format: 'datetime' },
    {
      key: 'channel',
      label: 'Channel',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
    },
  ],
};

export const supadataScrapeWebPageOutputSchema: OutputSchema = {
  fields: [
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'content', label: 'Content' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'ogUrl', label: 'Open Graph URL' },
    { key: 'countCharacters', label: 'Character Count', format: 'number' },
    { key: 'urls', label: 'URLs' },
  ],
};

export const supadataSearchYoutubeOutputSchema: OutputSchema = {
  fields: [
    { key: 'query', label: 'Query' },
    {
      key: 'results',
      label: 'Results',
      labelKey: 'title',
      listItems: [
        { key: 'type', label: 'Type' },
        { key: 'id', label: 'ID' },
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description' },
        { key: 'thumbnail', label: 'Thumbnail', format: 'image' },
        { key: 'duration', label: 'Duration', format: 'number' },
        { key: 'viewCount', label: 'View Count', format: 'number' },
        { key: 'uploadDate', label: 'Upload Date' },
        {
          key: 'channel',
          label: 'Channel',
          children: [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'thumbnail', label: 'Thumbnail', format: 'image' },
          ],
        },
      ],
    },
    { key: 'totalResults', label: 'Total Results', format: 'number' },
  ],
};

export const supadataGetYoutubeVideoOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'description', label: 'Description' },
    { key: 'title', label: 'Title' },
    {
      key: 'channel',
      label: 'Channel',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
    },
    { key: 'tags', label: 'Tags' },
    { key: 'thumbnail', label: 'Thumbnail', format: 'image' },
    { key: 'uploadDate', label: 'Upload Date', format: 'datetime' },
    { key: 'viewCount', label: 'View Count', format: 'number' },
    { key: 'likeCount', label: 'Like Count', format: 'number' },
    { key: 'isLive', label: 'Is Live', format: 'boolean' },
    { key: 'duration', label: 'Duration', format: 'number' },
    { key: 'transcriptLanguages', label: 'Transcript Languages' },
  ],
};

export const supadataGetTranscriptJobOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status' },
    { key: 'content', label: 'Content' },
    { key: 'lang', label: 'Language' },
    { key: 'availableLangs', label: 'Available Languages' },
    { key: 'error', label: 'Error' },
  ],
};
