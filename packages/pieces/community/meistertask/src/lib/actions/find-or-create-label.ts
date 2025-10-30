import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { getLabels, apiRequest } from '../api';
import { projectDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

const getLabelFields = (): DynamicPropsValue => {
  return {
    name: Property.ShortText({
      displayName: 'Label Name',
      description: 'Name of the label to find or create',
      required: true,
    }),
    color: Property.StaticDropdown({
      displayName: 'Color',
      description: 'Label color (required for creation)',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Red', value: '#d73502' },
          { label: 'Orange', value: '#d78002' },
          { label: 'Yellow', value: '#d7b002' },
          { label: 'Green', value: '#6fb41a' },
          { label: 'Blue', value: '#4a90e2' },
          { label: 'Purple', value: '#9013fe' },
          { label: 'Pink', value: '#e91e63' },
          { label: 'Gray', value: '#9e9e9e' },
        ],
      },
    }),
  };
};

export const findOrCreateLabelAction = createAction({
  auth: meisterTaskAuth,
  name: 'find_or_create_label',
  displayName: 'Find or Create Label',
  description: 'Finds a label by name or creates it if not found',
  props: {
    project_id: projectDropdown,
    labelFields: Property.DynamicProperties({
      displayName: 'Label Details',
      description: 'Label information',
      required: true,
      refreshers: [],
      props: async () => getLabelFields(),
    }),
  },
  async run({ auth, propsValue }) {
    const { project_id, labelFields } = propsValue;
    
    if (!labelFields || typeof labelFields !== 'object') {
      throw new Error('Label fields are required');
    }

    const { name, color } = labelFields as any;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Label name is required and cannot be empty');
    }

    const labels = await getLabels(auth, project_id);
    const match = labels.find((l: any) => 
      l.name && l.name.toLowerCase().trim() === name.toLowerCase().trim()
    );

    if (match) {
      return {
        success: true,
        found: true,
        data: match,
      };
    }

    if (!color) {
      throw new Error('Color is required to create label');
    }

    const body = { name: name.trim(), color };
    const result = await apiRequest<any>(auth, HttpMethod.POST, `/projects/${project_id}/labels`, body);
    return {
      success: true,
      found: false,
      data: result,
    };
  },
});
