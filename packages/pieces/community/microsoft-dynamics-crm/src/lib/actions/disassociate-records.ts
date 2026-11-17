import { createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../auth';
import { DynamicsCRMCommon, makeClient } from '../common';
import { odata } from '../common/odata';
import { associateOutputSchema } from '../common/output-schemas';
import { dynamicsProps } from '../common/props';

export const disassociateRecordsAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'disassociate_records',
  classification: 'DESTRUCTIVE',
  displayName: 'Disassociate Records',
  description: 'Removes the link between two records in a one-to-many or many-to-many relationship. The records themselves are kept.',
  audience: 'human',
  aiMetadata: {
    description: 'Removes the link between two Dynamics 365 records in a collection relationship; both records stay. A repeat call fails because the link is gone.',
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
    await makeClient(context.auth).disassociate({
      entitySet: entityType,
      recordId: id,
      navigationProperty,
      relatedRecordId: relatedId,
    });
    return {
      success: true,
      operation: 'disassociate',
      entitySet: entityType,
      recordId: id,
      navigationProperty,
      relatedEntitySet: targetEntitySet,
      relatedRecordId: relatedId,
    };
  },
});
