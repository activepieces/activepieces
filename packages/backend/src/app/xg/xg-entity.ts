import { EntitySchema } from 'typeorm';
import { BaseColumnSchemaPart } from '../database/database-common';

export const XgEntity = new EntitySchema({
  name: 'xg',
  columns: {
    ...BaseColumnSchemaPart,
    organizationId: {
      type: String,
    },
    organizationName: {
      type: String,
    },
    createdBy: {
      type: String,
    },
  },
});
