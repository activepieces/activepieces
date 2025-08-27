import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const uploadVideo = createAction({
  name: 'upload-video',
  displayName: 'Upload Video',
  description: 'Upload a video to your Vimeo account',
  props: {
    videoUrl: Property.ShortText({
      displayName: 'Video URL',
      description: 'The URL of the video to upload',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Video Name',
      description: 'The name/title of the video',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the video',
      required: false,
    }),
    privacy: Property.StaticDropdown({
      displayName: 'Privacy Setting',
      description: 'Who can view this video',
      required: false,
      options: {
        options: [
          { label: 'Public', value: 'anybody' },
          { label: 'Private', value: 'nobody' },
          { label: 'Unlisted', value: 'unlisted' },
          { label: 'Password Protected', value: 'password' },
          { label: 'Hide from Vimeo', value: 'disable' },
        ],
      },
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Password for password-protected videos',
      required: false,
    }),
    folderUri: Property.ShortText({
      displayName: 'Folder URI',
      description: 'The URI of the folder to upload to',
      required: false,
    }),
    license: Property.StaticDropdown({
      displayName: 'License',
      description: 'Creative Commons license for the video',
      required: false,
      options: {
        options: [
          { label: 'CC BY (Attribution)', value: 'by' },
          { label: 'CC BY-NC (Attribution-NonCommercial)', value: 'by-nc' },
          { label: 'CC BY-NC-ND (Attribution-NonCommercial-NoDerivs)', value: 'by-nc-nd' },
          { label: 'CC BY-NC-SA (Attribution-NonCommercial-ShareAlike)', value: 'by-nc-sa' },
          { label: 'CC BY-ND (Attribution-NoDerivs)', value: 'by-nd' },
          { label: 'CC BY-SA (Attribution-ShareAlike)', value: 'by-sa' },
          { label: 'CC0 (Public Domain)', value: 'cc0' },
        ],
      },
    }),
    allowComments: Property.StaticDropdown({
      displayName: 'Allow Comments',
      description: 'Who can comment on the video',
      required: false,
      options: {
        options: [
          { label: 'Anyone', value: 'anybody' },
          { label: 'Contacts Only', value: 'contacts' },
          { label: 'No One', value: 'nobody' },
        ],
      },
    }),
    allowEmbedding: Property.StaticDropdown({
      displayName: 'Allow Embedding',
      description: 'Embedding settings for the video',
      required: false,
      options: {
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Private', value: 'private' },
          { label: 'Whitelist Only', value: 'whitelist' },
        ],
      },
    }),
    allowDownload: Property.Checkbox({
      displayName: 'Allow Download',
      description: 'Whether users can download the video',
      required: false,
    }),
    hideFromVimeo: Property.Checkbox({
      displayName: 'Hide from Vimeo',
      description: 'Hide video from everyone except owner',
      required: false,
    }),
    embedDomains: Property.Array({
      displayName: 'Embed Domains',
      description: 'List of domains where video can be embedded (for whitelist)',
      required: false,
    }),
    embedColor: Property.ShortText({
      displayName: 'Embed Player Color',
      description: 'Main color of the embeddable player (hex color)',
      required: false,
    }),
    showVimeoLogo: Property.Checkbox({
      displayName: 'Show Vimeo Logo',
      description: 'Whether to show the Vimeo logo on embeddable player',
      required: false,
    }),
    showPlaybar: Property.Checkbox({
      displayName: 'Show Playbar',
      description: 'Whether to show the playbar on embeddable player',
      required: false,
    }),
    showVolumeControl: Property.Checkbox({
      displayName: 'Show Volume Control',
      description: 'Whether to show volume selector on embeddable player',
      required: false,
    }),
    contentRating: Property.Array({
      displayName: 'Content Rating',
      description: 'List of values describing the content in the video',
      required: false,
    }),
    locale: Property.ShortText({
      displayName: 'Language',
      description: 'Video default language (e.g., en, es, fr)',
      required: false,
    }),
  },
  async run(context) {
    const { videoUrl, name, description, privacy, password, folderUri, license, 
            allowComments, allowEmbedding, allowDownload, hideFromVimeo, 
            embedDomains, embedColor, showVimeoLogo, showPlaybar, showVolumeControl,
            contentRating, locale } = context.propsValue;

    // Build the request body based on provided fields
    const requestBody: any = {
      upload: {
        approach: 'pull',
        link: videoUrl,
      },
      name,
    };

    // Add optional fields if provided
    if (description) requestBody.description = description;
    if (privacy) requestBody.privacy = { view: privacy };
    if (password && privacy === 'password') requestBody.password = password;
    if (folderUri) requestBody.folder_uri = folderUri;
    if (license) requestBody.license = license;
    if (allowComments) requestBody.privacy = { ...requestBody.privacy, comments: allowComments };
    if (allowEmbedding) requestBody.privacy = { ...requestBody.privacy, embed: allowEmbedding };
    if (allowDownload !== undefined) requestBody.privacy = { ...requestBody.privacy, download: allowDownload };
    if (hideFromVimeo !== undefined) requestBody.hide_from_vimeo = hideFromVimeo;
    if (embedDomains && embedDomains.length > 0) requestBody.embed_domains = embedDomains;
    if (contentRating && contentRating.length > 0) requestBody.content_rating = contentRating;
    if (locale) requestBody.locale = locale;

    // Build embed settings if any embed-related fields are provided
    const embedSettings: any = {};
    if (embedColor) embedSettings.color = embedColor;
    if (showVimeoLogo !== undefined) embedSettings.logos = { vimeo: showVimeoLogo };
    if (showPlaybar !== undefined) embedSettings.playbar = showPlaybar;
    if (showVolumeControl !== undefined) embedSettings.volume = showVolumeControl;

    if (Object.keys(embedSettings).length > 0) {
      requestBody.embed = embedSettings;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.vimeo.com/me/videos',
        headers: {
          'Authorization': `Bearer ${(context.auth as any).access_token}`,
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      if (response.status === 201) {
        return {
          success: true,
          video: response.body,
          message: 'Video upload initiated successfully',
        };
      } else {
        throw new Error(`Upload failed with status ${response.status}: ${response.body}`);
      }
    } catch (error) {
      throw new Error(`Failed to upload video: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});
