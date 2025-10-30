import { createAction, Property } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { getPersons } from '../api';
import { projectDropdown } from '../common/props';

export const findPersonAction = createAction({
  auth: meisterTaskAuth,
  name: 'find_person',
  displayName: 'Find Person',
  description: 'Finds persons in a project',
  props: {
    project_id: projectDropdown,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the person to search for (leave empty to get all persons)',
      required: false,
    }),
    person_id: Property.ShortText({
      displayName: 'Person ID',
      description: 'ID of the person to find',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { project_id, name, person_id } = propsValue;
    
    const persons = await getPersons(auth, project_id);
    let results = persons;
    
    if (person_id && typeof person_id === 'string' && person_id.trim().length > 0) {
      results = results.filter((p: any) => p.id.toString() === person_id.trim());
    } else if (name && typeof name === 'string' && name.trim().length > 0) {
      results = results.filter((p: any) => {
        const fullName = `${p.firstname} ${p.lastname}`.toLowerCase();
        return fullName.includes(name.trim().toLowerCase());
      });
    }
    
    return {
      success: true,
      persons: results,
      count: results.length,
    };
  },
});
