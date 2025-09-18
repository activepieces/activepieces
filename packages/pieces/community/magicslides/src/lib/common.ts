import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

export async function apiRequest({
  auth,
  path,
  method = HttpMethod.GET,
  body,
  queryParams,
}: {
  auth: any;
  path: string;
  method?: HttpMethod;
  body?: any;
  queryParams?: Record<string, string>;
}) {
  const baseUrl = 'https://api.magicslides.app';
  const { username, password } = auth;

  body.email = username;
  body.accessId = password;

  try {
    return await httpClient.sendRequest({
      method,
      url: `${baseUrl}${path}`,
      body,
      queryParams,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  catch(err: any){
    if (err.response?.body?.error) {
      const magicslidesError = err.response.body.error;
      throw new Error(`MagicSlides API error: ${magicslidesError.message || magicslidesError}`);
    }

    const statusCode = err.response?.status;
    if (statusCode === 429) throw new Error('Rate limit exceeded. Please try again later.');
    if (statusCode === 401) throw new Error('Authentication failed. Please check your MagicSlides access ID.');
    if (statusCode === 404) throw new Error('Resource not found.');

    throw new Error(`MagicSlides API error: ${err.message || err}`);
  }
}

export const templateDropdown = Property.Dropdown({
  displayName: 'Template',
  description: 'Presentation template style',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    // Static list of templates since MagicSlides doesn't provide an API to fetch them
    const templates = [
      { value: 'bullet-point1', label: 'Bullet Point 1' },
      { value: 'bullet-point2', label: 'Bullet Point 2' },
      { value: 'bullet-point4', label: 'Bullet Point 4' },
      { value: 'bullet-point5', label: 'Bullet Point 5' },
      { value: 'bullet-point6', label: 'Bullet Point 6' },
      { value: 'bullet-point7', label: 'Bullet Point 7' },
      { value: 'bullet-point8', label: 'Bullet Point 8' },
      { value: 'bullet-point9', label: 'Bullet Point 9' },
      { value: 'bullet-point10', label: 'Bullet Point 10' },
      { value: 'custom2', label: 'Custom 2' },
      { value: 'custom3', label: 'Custom 3' },
      { value: 'custom4', label: 'Custom 4' },
      { value: 'custom5', label: 'Custom 5' },
      { value: 'custom6', label: 'Custom 6' },
      { value: 'custom7', label: 'Custom 7' },
      { value: 'custom8', label: 'Custom 8' },
      { value: 'custom9', label: 'Custom 9' },
      { value: 'verticalBulletPoint1', label: 'Vertical Bullet Point 1' },
      { value: 'verticalCustom1', label: 'Vertical Custom 1' },
      { value: 'ed-bullet-point1', label: 'Editable Bullet Point 1' },
      { value: 'ed-bullet-point2', label: 'Editable Bullet Point 2' },
      { value: 'ed-bullet-point4', label: 'Editable Bullet Point 4' },
      { value: 'ed-bullet-point5', label: 'Editable Bullet Point 5' },
      { value: 'ed-bullet-point6', label: 'Editable Bullet Point 6' },
      { value: 'ed-bullet-point7', label: 'Editable Bullet Point 7' },
      { value: 'ed-bullet-point9', label: 'Editable Bullet Point 9' },
      { value: 'custom Dark 1', label: 'Custom Dark 1' },
      { value: 'Custom gold 1', label: 'Custom Gold 1' },
      { value: 'custom sync 1', label: 'Custom Sync 1' },
      { value: 'custom sync 2', label: 'Custom Sync 2' },
      { value: 'custom sync 3', label: 'Custom Sync 3' },
      { value: 'custom sync 4', label: 'Custom Sync 4' },
      { value: 'custom sync 5', label: 'Custom Sync 5' },
      { value: 'custom sync 6', label: 'Custom Sync 6' },
      { value: 'custom-ed-7', label: 'Custom Editable 7' },
      { value: 'custom-ed-8', label: 'Custom Editable 8' },
      { value: 'custom-ed-9', label: 'Custom Editable 9' },
      { value: 'custom-ed-10', label: 'Custom Editable 10' },
      { value: 'custom-ed-11', label: 'Custom Editable 11' },
      { value: 'custom-ed-12', label: 'Custom Editable 12' },
      { value: 'pitchdeckorignal', label: 'Pitch Deck Original' },
      { value: 'pitch-deck-2', label: 'Pitch Deck 2' },
      { value: 'pitch-deck-3', label: 'Pitch Deck 3' },
    ];

    return {
      options: templates,
    };
  },
});