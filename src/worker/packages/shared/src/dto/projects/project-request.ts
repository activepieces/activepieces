import KSUID from 'ksuid';

export interface ProjectDTO {
  id?: KSUID;
  displayName: string;
}

export const ProjectDTOSchema = {
  body: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      displayName: { type: 'string' },
    },
    required: ['displayName'],
  },
};
