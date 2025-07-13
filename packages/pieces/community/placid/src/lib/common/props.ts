import { Property } from '@activepieces/pieces-framework';
import { PlacidClient } from './client';

const createTemplateDropdown = (outputType?: 'image' | 'pdf' | 'video') => Property.Dropdown({
  displayName: 'Template',
  description: `Select a Placid template${outputType ? ` for ${outputType} generation` : ''}`,
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const client = new PlacidClient(auth as string);
      const templates = await client.getTemplates();
      
      console.log('Templates response:', templates);
      
      if (!templates || templates.length === 0) {
        return {
          options: [],
          placeholder: 'No templates found in your Placid project',
        };
      }
      
      // Filter templates by tags or naming if outputType is specified
      let filteredTemplates = templates;
      if (outputType) {
        filteredTemplates = templates.filter(template => {
          const title = template.title.toLowerCase();
          const tags = template.tags?.map(tag => tag.toLowerCase()) || [];
          
          // Check if template title or tags indicate it's for this output type
          return title.includes(outputType) || 
                 tags.includes(outputType) ||
                 tags.includes(`${outputType}s`) ||
                 // For backwards compatibility, if no specific filtering matches, include all
                 (!title.includes('image') && !title.includes('pdf') && !title.includes('video') &&
                  !tags.some(tag => ['image', 'pdf', 'video', 'images', 'pdfs', 'videos'].includes(tag)));
        });
      }
      
      // If filtering resulted in no templates, show all templates with a note
      if (outputType && filteredTemplates.length === 0) {
        filteredTemplates = templates;
      }
      
      return {
        options: filteredTemplates.map((template) => {
          // Build layer info for the label
          let layerInfo = '';
          if (template.layers && template.layers.length > 0) {
            const layerNames = template.layers.map(layer => layer.name).join(', ');
            layerInfo = ` (Layers: ${layerNames})`;
          } else {
            layerInfo = ' (No layers)';
          }
          
          return {
            label: template.title + layerInfo + (outputType && filteredTemplates.length === templates.length ? ' - All templates shown' : ''),
            value: template.uuid,
          };
        }),
      };
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      return {
        disabled: true,
        options: [],
        placeholder: `Failed to load templates: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

// General template dropdown for all types
export const templateDropdown = createTemplateDropdown();

// Specific template dropdowns for each output type
export const imageTemplateDropdown = createTemplateDropdown('image');
export const pdfTemplateDropdown = createTemplateDropdown('pdf');
export const videoTemplateDropdown = createTemplateDropdown('video');

export const layersProperty = Property.Object({
  displayName: 'Layers',
  description: `Layer data to fill in the template. Each key should match a layer name in your template.
  
Example:
{
  "title": "My Title Text",
  "subtitle": "My Subtitle", 
  "image": "https://example.com/image.jpg",
  "logo": "https://example.com/logo.png"
}

Note: Layer names must match exactly what's defined in your Placid template.`,
  required: false,
});


export const modificationsProperty = Property.Object({
  displayName: 'Modifications',
  description: 'Optional modifications to the generated image (width, height, filename)',
  required: false,
});

export const webhookProperty = Property.ShortText({
  displayName: 'Webhook URL',
  description: 'Optional webhook URL to receive notification when generation is complete',
  required: false,
});

export const createNowProperty = Property.Checkbox({
  displayName: 'Create Now',
  description: 'Whether to create the image immediately (synchronous) or queue it (asynchronous)',
  required: false,
  defaultValue: false,
});

export const passthroughProperty = Property.Object({
  displayName: 'Passthrough Data',
  description: 'Optional data to pass through to the webhook',
  required: false,
});

