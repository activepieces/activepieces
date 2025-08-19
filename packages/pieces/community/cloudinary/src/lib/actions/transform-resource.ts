import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../common/auth';
import { resourceTypeDropdown, publicIdsDropdown } from '../common/props';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const transformResource = createAction({
  auth: cloudinaryAuth,
  name: 'transformResource',
  displayName: 'Transform Resource',
  description: 'Apply transformations (resize, crop, watermark, etc.) to an asset and generate a new URL.',
  props: {
    resource_type: resourceTypeDropdown,
    public_ids_dropdown: publicIdsDropdown,
    public_id_manual: Property.ShortText({
      displayName: 'Manual Public ID',
      description: 'Or enter public ID manually if not in dropdown',
      required: false,
    }),
    
    width: Property.Number({
      displayName: 'Width',
      description: 'Target width in pixels',
      required: false,
    }),
    height: Property.Number({
      displayName: 'Height', 
      description: 'Target height in pixels',
      required: false,
    }),
    crop_mode: Property.StaticDropdown({
      displayName: 'Crop Mode',
      description: 'How to handle resizing when aspect ratios differ',
      required: false,
      options: {
        options: [
          { label: 'Scale (fit within bounds)', value: 'scale' },
          { label: 'Fill (crop to exact size)', value: 'fill' },
          { label: 'Fit (pad to exact size)', value: 'fit' },
          { label: 'Crop (exact size, smart cropping)', value: 'crop' },
          { label: 'Thumb (face-aware cropping)', value: 'thumb' },
          { label: 'Limit (only scale down)', value: 'limit' },
        ],
      },
    }),
    gravity: Property.StaticDropdown({
      displayName: 'Gravity',
      description: 'Which part to focus on when cropping',
      required: false,
      options: {
        options: [
          { label: 'Auto (smart cropping)', value: 'auto' },
          { label: 'Face detection', value: 'face' },
          { label: 'Center', value: 'center' },
          { label: 'North (top)', value: 'north' },
          { label: 'South (bottom)', value: 'south' },
          { label: 'East (right)', value: 'east' },
          { label: 'West (left)', value: 'west' },
          { label: 'Northwest (top-left)', value: 'north_west' },
          { label: 'Northeast (top-right)', value: 'north_east' },
          { label: 'Southwest (bottom-left)', value: 'south_west' },
          { label: 'Southeast (bottom-right)', value: 'south_east' },
        ],
      },
    }),
    
    format: Property.StaticDropdown({
      displayName: 'Output Format',
      description: 'Convert to this format',
      required: false,
      options: {
        options: [
          { label: 'Auto (best format for browser)', value: 'auto' },
          { label: 'JPEG', value: 'jpg' },
          { label: 'PNG', value: 'png' },
          { label: 'WebP', value: 'webp' },
          { label: 'AVIF', value: 'avif' },
          { label: 'GIF', value: 'gif' },
          { label: 'SVG', value: 'svg' },
        ],
      },
    }),
    quality: Property.StaticDropdown({
      displayName: 'Quality',
      description: 'Image quality/compression level',
      required: false,
      options: {
        options: [
          { label: 'Auto (optimal for format)', value: 'auto' },
          { label: 'High (90)', value: '90' },
          { label: 'Good (80)', value: '80' },
          { label: 'Medium (70)', value: '70' },
          { label: 'Low (50)', value: '50' },
        ],
      },
    }),
    
    border: Property.ShortText({
      displayName: 'Border',
      description: 'Add border (e.g., "5px_solid_blue", "10px_solid_#ff0000")',
      required: false,
    }),
    radius: Property.StaticDropdown({
      displayName: 'Border Radius',
      description: 'Round corners or make circular',
      required: false,
      options: {
        options: [
          { label: 'Slight rounding (10px)', value: '10' },
          { label: 'Rounded corners (20px)', value: '20' },
          { label: 'Very rounded (50px)', value: '50' },
          { label: 'Circle/Oval (max)', value: 'max' },
        ],
      },
    }),
    opacity: Property.Number({
      displayName: 'Opacity',
      description: 'Transparency level (0-100, where 100 is opaque)',
      required: false,
    }),
    rotation: Property.Number({
      displayName: 'Rotation',
      description: 'Rotate image by degrees (0-360)',
      required: false,
    }),
    
    raw_transformation: Property.LongText({
      displayName: 'Raw Transformation',
      description: 'Advanced: Raw transformation string (e.g., "c_fill,w_300,h_200/e_sepia/r_20"). This will be applied after the above basic transformations.',
      required: false,
    }),
    
    generate_url_only: Property.Checkbox({
      displayName: 'Generate URL Only',
      description: 'If true, only return the transformation URL. If false, also make a request to generate the transformed asset.',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      resource_type,
      public_ids_dropdown, 
      public_id_manual,
      width,
      height,
      crop_mode,
      gravity,
      format,
      quality,
      border,
      radius,
      opacity,
      rotation,
      raw_transformation,
      generate_url_only
    } = propsValue;

    let public_id: string;
    if (Array.isArray(public_ids_dropdown) && public_ids_dropdown.length > 0) {
      public_id = public_ids_dropdown[0] as string;
    } else if (public_id_manual) {
      public_id = public_id_manual;
    } else {
      throw new Error('Please select an asset from dropdown or enter a public ID manually.');
    }

    const cloud_name = auth.cloud_name.trim();
    
    const transformations: string[] = [];
    
    const basicParams: string[] = [];
    if (width) basicParams.push(`w_${width}`);
    if (height) basicParams.push(`h_${height}`);
    if (crop_mode) basicParams.push(`c_${crop_mode}`);
    if (gravity) basicParams.push(`g_${gravity}`);
    
    if (basicParams.length > 0) {
      transformations.push(basicParams.join(','));
    }
    
    if (format) transformations.push(`f_${format}`);
    if (quality) transformations.push(`q_${quality}`);
    
    if (border) transformations.push(`bo_${border}`);
    if (radius) transformations.push(`r_${radius}`);
    if (opacity !== undefined) transformations.push(`o_${opacity}`);
    if (rotation !== undefined) transformations.push(`a_${rotation}`);
    
    if (raw_transformation) {
      transformations.push(raw_transformation);
    }
    
    const transformationString = transformations.length > 0 ? transformations.join('/') + '/' : '';
    const transformationUrl = `https://res.cloudinary.com/${cloud_name}/${resource_type}/upload/${transformationString}${public_id}`;
    
    let finalUrl = transformationUrl;
    if (format && format !== 'auto') {
      finalUrl = `${transformationUrl}.${format === 'jpg' ? 'jpg' : format}`;
    }
    
    const result: any = {
      transformation_url: finalUrl,
      public_id: public_id,
      resource_type: resource_type,
      applied_transformations: transformations,
      cloud_name: cloud_name,
    };
    
    if (!generate_url_only) {
      try {
        const response = await httpClient.sendRequest({
          method: HttpMethod.HEAD,
          url: finalUrl,
        });
        result.transformation_triggered = response.status >= 200 && response.status < 300;
        result.status_code = response.status;
      } catch (error) {
        result.transformation_triggered = false;
        result.error = 'Failed to trigger transformation generation';
      }
    }
    
    return result;
  },
});
