import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vimeoAuth } from '../common/auth';
import { vimeoCommon } from '../common/client';

export const uploadVideo = createAction({
    name: 'upload_video',
    displayName: 'Upload Video',
    description: 'Upload a video to your Vimeo account using the pull approach',
    auth: vimeoAuth,
    props: {
        upload_approach: Property.StaticDropdown({
            displayName: 'Upload Approach',
            description: 'Method to upload the video',
            required: true,
            defaultValue: 'pull',
            options: {
                options: [
                    { label: 'Pull - Upload from URL', value: 'pull' },
                    { label: 'TUS - Resumable upload', value: 'tus' },
                    { label: 'POST - Form-based upload', value: 'post' }
                ]
            }
        }),
        video_url: Property.ShortText({
            displayName: 'Video URL',
            description: 'Direct URL to the video file (required for pull approach)',
            required: false,
        }),
        video_size: Property.Number({
            displayName: 'Video Size (bytes)',
            description: 'Size of the video file in bytes (required for pull and tus approaches)',
            required: false,
        }),
        redirect_url: Property.ShortText({
            displayName: 'Redirect URL',
            description: 'URL to redirect to after form upload completes (required for post approach)',
            required: false,
        }),
        name: Property.ShortText({
            displayName: 'Video Name',
            description: 'Title for the video',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'Description for the video',
            required: false,
        }),
        folder_uri: Property.ShortText({
            displayName: 'Folder URI',
            description: 'URI of the folder to upload the video to (e.g., /users/{user_id}/projects/{project_id})',
            required: false,
        }),
        privacy_view: Property.StaticDropdown({
            displayName: 'Privacy - Who can view',
            description: 'Who can view the video on Vimeo',
            required: false,
            defaultValue: 'anybody',
            options: {
                options: [
                    { label: 'Public - Anyone can access', value: 'anybody' },
                    { label: 'Unlisted - Only with private link', value: 'unlisted' },
                    { label: 'Private - Only owner', value: 'nobody' },
                    { label: 'Password - With password only', value: 'password' },
                    { label: 'Hide from Vimeo - Embeddable but hidden', value: 'disable' }
                ]
            }
        }),
        password: Property.ShortText({
            displayName: 'Password',
            description: 'Password for the video (required when privacy view is password)',
            required: false,
        }),
        privacy_embed: Property.StaticDropdown({
            displayName: 'Privacy - Embed setting',
            description: 'Where the video can be embedded',
            required: false,
            defaultValue: 'public',
            options: {
                options: [
                    { label: 'Public - Can be embedded anywhere', value: 'public' },
                    { label: 'Private - Cannot be embedded', value: 'private' },
                    { label: 'Whitelist - Only on specified domains', value: 'whitelist' }
                ]
            }
        }),
        embed_domains: Property.Array({
            displayName: 'Embed Domains',
            description: 'List of domains where video can be embedded (required when embed privacy is whitelist)',
            required: false,
            properties: {
                domain: Property.ShortText({
                    displayName: 'Domain',
                    description: 'Domain name (e.g., example.com)',
                    required: true,
                })
            }
        }),
        privacy_download: Property.Checkbox({
            displayName: 'Privacy - Allow Download',
            description: 'Whether users can download the video (not available for Vimeo Free)',
            required: false,
            defaultValue: false,
        }),
        privacy_add: Property.Checkbox({
            displayName: 'Privacy - Allow Adding to Collections',
            description: 'Whether users can add the video to showcases, channels, or groups',
            required: false,
            defaultValue: true,
        }),
        privacy_comments: Property.StaticDropdown({
            displayName: 'Privacy - Comments',
            description: 'Who can comment on the video',
            required: false,
            defaultValue: 'anybody',
            options: {
                options: [
                    { label: 'Anyone can comment', value: 'anybody' },
                    { label: 'Only contacts can comment', value: 'contacts' },
                    { label: 'No one can comment', value: 'nobody' }
                ]
            }
        }),
        hide_from_vimeo: Property.Checkbox({
            displayName: 'Hide from Vimeo',
            description: 'Hide video from everyone except owner (unlisted links work only for owner)',
            required: false,
            defaultValue: false,
        }),
        license: Property.StaticDropdown({
            displayName: 'Creative Commons License',
            description: 'Creative Commons license for the video',
            required: false,
            options: {
                options: [
                    { label: 'None - All rights reserved', value: '' },
                    { label: 'CC BY - Attribution', value: 'by' },
                    { label: 'CC BY-NC - Attribution-NonCommercial', value: 'by-nc' },
                    { label: 'CC BY-NC-ND - Attribution-NonCommercial-NoDerivs', value: 'by-nc-nd' },
                    { label: 'CC BY-NC-SA - Attribution-NonCommercial-ShareAlike', value: 'by-nc-sa' },
                    { label: 'CC BY-ND - Attribution-NoDerivs', value: 'by-nd' },
                    { label: 'CC BY-SA - Attribution-ShareAlike', value: 'by-sa' },
                    { label: 'CC0 - Public Domain', value: 'cc0' }
                ]
            }
        }),
        locale: Property.ShortText({
            displayName: 'Language',
            description: 'Default language of the video (e.g., en, es, fr)',
            required: false,
        }),
        review_page_active: Property.Checkbox({
            displayName: 'Enable Video Review',
            description: 'Enable video review page',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        const {
            upload_approach,
            video_url,
            video_size,
            redirect_url,
            name,
            description,
            folder_uri,
            privacy_view,
            password,
            privacy_embed,
            embed_domains,
            privacy_download,
            privacy_add,
            privacy_comments,
            hide_from_vimeo,
            license,
            locale,
            review_page_active
        } = context.propsValue;

        const approach = upload_approach || 'pull';

        if (approach === 'pull' && !video_url) {
            throw new Error('Video URL is required for pull uploads');
        }
        if ((approach === 'pull' || approach === 'tus') && !video_size) {
            throw new Error('Video size is required for pull and tus uploads');
        }
        if (approach === 'post' && !redirect_url) {
            throw new Error('Redirect URL is required for post uploads');
        }
        if (privacy_view === 'password' && !password) {
            throw new Error('Password is required when privacy view is set to password');
        }
        if (privacy_embed === 'whitelist' && (!embed_domains || embed_domains.length === 0)) {
            throw new Error('Embed domains are required when embed privacy is set to whitelist');
        }

        const requestBody: any = {
            upload: {
                approach: approach
            }
        };

        if (approach === 'pull') {
            requestBody.upload.size = video_size;
            requestBody.upload.link = video_url;
        } else if (approach === 'tus') {
            requestBody.upload.size = video_size;
        } else if (approach === 'post') {
            requestBody.upload.redirect_url = redirect_url;
        }

        if (name) {
            requestBody.name = name;
        }

        if (description) {
            requestBody.description = description;
        }

        if (folder_uri) {
            requestBody.folder_uri = folder_uri;
        }

        if (hide_from_vimeo !== undefined) {
            requestBody.hide_from_vimeo = hide_from_vimeo;
        }

        if (license) {
            requestBody.license = license;
        }

        if (locale) {
            requestBody.locale = locale;
        }

        if (password && privacy_view === 'password') {
            requestBody.password = password;
        }

        const privacySettings: any = {};
        if (privacy_view) {
            privacySettings.view = privacy_view;
        }
        if (privacy_embed) {
            privacySettings.embed = privacy_embed;
        }
        if (privacy_download !== undefined) {
            privacySettings.download = privacy_download;
        }
        if (privacy_add !== undefined) {
            privacySettings.add = privacy_add;
        }
        if (privacy_comments) {
            privacySettings.comments = privacy_comments;
        }

        if (Object.keys(privacySettings).length > 0) {
            requestBody.privacy = privacySettings;
        }

        if (privacy_embed === 'whitelist' && embed_domains && embed_domains.length > 0) {
            requestBody.embed_domains = embed_domains.map((item: any) => item.domain);
        }

        if (review_page_active !== undefined) {
            requestBody.review_page = {
                active: review_page_active
            };
        }

        try {
            const response = await vimeoCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.POST,
                resourceUri: '/me/videos',
                body: requestBody
            });

            if (response.status === 201) {
                const responseData = response.body;
                
                if (responseData.upload?.approach !== approach) {
                    throw new Error(`Upload approach verification failed. Expected "${approach}" but got: ${responseData.upload?.approach}`);
                }

                const result: any = {
                    success: true,
                    video_uri: responseData.uri,
                    video_link: responseData.link,
                    video_id: responseData.uri?.split('/').pop(),
                    upload_approach: responseData.upload?.approach,
                    upload_status: responseData.upload?.status,
                    name: responseData.name,
                    description: responseData.description,
                    privacy: responseData.privacy,
                    created_time: responseData.created_time
                };

                if (approach === 'pull') {
                    result.message = 'Video pull upload initiated successfully. Vimeo will now download the video from the provided URL.';
                } else if (approach === 'tus') {
                    result.upload_link = responseData.upload?.upload_link;
                    result.message = 'TUS upload initialized. Use the upload_link to begin resumable upload.';
                } else if (approach === 'post') {
                    result.upload_form = responseData.upload?.form;
                    result.upload_link = responseData.upload?.upload_link;
                    result.message = 'Form upload initialized. Use the upload_form HTML for file upload.';
                }

                return result;
            } else {
                throw new Error(`Unexpected response status: ${response.status}`);
            }
        } catch (error: any) {
            if (error.response?.body?.error_code) {
                const errorCode = error.response.body.error_code;
                const errorMessage = error.response.body.developer_message || error.response.body.error || 'Unknown error';
                
                switch (errorCode) {
                    case 2204:
                        throw new Error(`Invalid parameters: ${errorMessage}. Please check your input values.`);
                    case 2205:
                        throw new Error(`Request format error: ${errorMessage}. Please verify your inputs.`);
                    case 2230:
                        throw new Error(`Invalid upload approach: ${errorMessage}. Use 'pull', 'post', or 'tus'.`);
                    case 2510:
                        throw new Error(`Invalid URL: ${errorMessage}. The URL must resolve directly to a video file and be properly encoded.`);
                    case 3116:
                        throw new Error(`Deprecated parameter: ${errorMessage}. Use 'upload.approach' instead of 'type'.`);
                    case 4003:
                        throw new Error(`Upload initialization error: ${errorMessage}. Please try again.`);
                    case 4101:
                        throw new Error(`Upload quota exceeded: You've reached your yearly/lifetime upload limit. Please upgrade your Vimeo account.`);
                    case 4102:
                        throw new Error(`Upload quota exceeded: You've reached your weekly upload limit. Please upgrade your Vimeo account.`);
                    case 4104:
                        throw new Error(`Upload quota exceeded: You've reached your daily upload limit (10 uploads/day for free accounts).`);
                    case 8002:
                        throw new Error(`Authentication error: Invalid access token. Please check your Vimeo authentication.`);
                    default:
                        throw new Error(`Vimeo API error ${errorCode}: ${errorMessage}`);
                }
            }
            
            throw new Error(`Upload failed: ${error.message || 'Unknown error occurred'}`);
        }
    },
});
