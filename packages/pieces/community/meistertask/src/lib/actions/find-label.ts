import { createAction, Property } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { getLabels } from '../api';
import { projectDropdown } from '../common/props';

export const findLabelAction = createAction({
  auth: meisterTaskAuth,
  name: 'find_label',
  displayName: 'Find Label',
  description: 'Finds labels in a project',
  props: {
    project_id: projectDropdown,
    label_name: Property.ShortText({
      displayName: 'Label Name',
      description: 'Name of the label to search for (leave empty to get all labels)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { project_id, label_name } = propsValue;
    
    const labels = await getLabels(auth, project_id);
    
    if (label_name && typeof label_name === 'string' && label_name.trim().length > 0) {
      const filteredLabels = labels.filter((l: any) => 
        l.name && l.name.toLowerCase().includes(label_name.trim().toLowerCase())
      );
      return {
        success: true,
        labels: filteredLabels,
        count: filteredLabels.length,
      };
    }
    
    return {
      success: true,
      labels,
      count: labels.length,
    };
  },
});
