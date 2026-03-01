import { EntityProp } from '../types';

export const projectsEntityProps: EntityProp[] = [
  {
    name: 'number',
    displayName: 'Number',
    description: 'Specifies the number of the project.',

    type: 'text',
    isRequired: false,
  },
  {
    name: 'displayName',
    displayName: 'Display name',
    description:
      "Specifies the project's name. This name will appear on all sales documents for the project.",
    type: 'text',
    isRequired: false,
  },
];
