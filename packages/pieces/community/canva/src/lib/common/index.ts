import { Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaApiCall } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.canva.com/rest/v1';

/**
 * Design type dropdown for creating designs.
 * Values are preset design type names per Canva API.
 */
export const designTypeDropdown = Property.StaticDropdown({
  displayName: 'Design Type',
  description: 'The type of design to create',
  required: true,
  options: {
    disabled: false,
    options: [
      { label: 'Document', value: 'doc' },
      { label: 'Whiteboard', value: 'whiteboard' },
      { label: 'Presentation', value: 'presentation' },
      { label: 'Instagram Post', value: 'instagramPost' },
      { label: 'Facebook Post', value: 'facebookPost' },
      { label: 'Poster', value: 'poster' },
      { label: 'Flyer', value: 'flyer' },
      { label: 'A4 Document', value: 'a4Document' },
      { label: 'Logo', value: 'logo' },
    ],
  },
});

/**
 * Export format dropdown.
 * Values match the format.type field per Canva Export API.
 */
export const exportFormatDropdown = Property.StaticDropdown({
  displayName: 'Export Format',
  description: 'The format to export the design as',
  required: true,
  options: {
    disabled: false,
    options: [
      { label: 'PDF', value: 'pdf' },
      { label: 'PNG', value: 'png' },
      { label: 'JPG', value: 'jpg' },
      { label: 'GIF', value: 'gif' },
      { label: 'PowerPoint (PPTX)', value: 'pptx' },
      { label: 'Video (MP4)', value: 'mp4' },
    ],
  },
});

/**
 * Export quality dropdown.
 */
export const exportQualityDropdown = Property.StaticDropdown({
  displayName: 'Export Quality',
  description: 'The quality of the exported file',
  required: false,
  options: {
    disabled: false,
    options: [
      { label: 'Regular', value: 'regular' },
      { label: 'Pro (Premium)', value: 'pro' },
    ],
  },
});

/**
 * Design dropdown - dynamically loads user's designs
 */
export const designDropdown = Property.Dropdown({
  displayName: 'Design',
  description: 'Select a design from your Canva account',
  required: true,
  refreshers: [],
  auth: canvaAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account first',
        options: [],
      };
    }

    try {
      const response = await canvaApiCall<{
        items: Array<{ id: string; title?: string }>;
      }>({
        auth,
        method: HttpMethod.GET,
        path: '/designs',
        queryParams: {
          limit: '50',
        },
      });

      return {
        disabled: false,
        options: response.items.map((design) => ({
          label: design.title || design.id,
          value: design.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Error loading designs',
        options: [],
      };
    }
  },
});
