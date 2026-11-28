import { createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../auth';
import { DynamicsCRMCommon, makeClient } from '../common';
import { odata } from '../common/odata';
import { associateOutputSchema } from '../common/output-schemas';
import { dynamicsProps } from '../common/props';

export const associateRecordsAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'associate_records',
  classification: 'WRITE',
  displayName: 'Associate Records',
  description: 'Links two records through a one-to-many or many-to-many relationship.',
  audience: 'human',
  aiMetadata: {
    description: 'Links two Dynamics 365 records through a collection relationship. A repeated many-to-many link fails as a duplicate.',
    idempotent: false,
  },
  props: {
    entityType: DynamicsCRMCommon.entityType('The table of the first record.'),
    recordId: DynamicsCRMCommon.recordId,
    relationship: dynamicsProps.relationshipDropdown,
    relatedRecordId: dynamicsProps.relatedRecordDropdown,
  },
  outputSchema: associateOutputSchema,
  async run(context) {
    const { entityType, recordId, relationship, relatedRecordId } = context.propsValue;
    const { navigationProperty, targetEntitySet } = dynamicsProps.parseRelationship(relationship);
    const id = odata.requireGuid({ value: recordId, label: 'Record' });
    const relatedId = odata.requireGuid({ value: relatedRecordId, label: 'Related record' });
    await makeClient(context.auth).associate({
      entitySet: entityType,
      recordId: id,
      navigationProperty,
      relatedEntitySet: targetEntitySet,
      relatedRecordId: relatedId,
    });
    return {
      success: true,
      operation: 'associate',
      entitySet: entityType,
      recordId: id,
      navigationProperty,
      relatedEntitySet: targetEntitySet,
      relatedRecordId: relatedId,
    };
  },
});
