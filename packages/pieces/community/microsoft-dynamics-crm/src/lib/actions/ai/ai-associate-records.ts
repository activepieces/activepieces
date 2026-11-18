import { Property, createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { odata } from '../../common/odata';
import { associateOutputSchema } from '../../common/output-schemas';

export const aiAssociateRecordsAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'ai_associate_records',
  classification: 'DESTRUCTIVE',
  displayName: 'Associate or Disassociate Records',
  description: 'Links or unlinks two records through a collection relationship.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Links (associate) or unlinks (disassociate) two Dynamics 365 records through a one-to-many or many-to-many relationship; take navigationProperty and relatedEntitySet from collectionRelationships in Describe Entity. Records are never deleted. Not idempotent: a repeated many-to-many link or a repeated unlink fails.',
    idempotent: false,
  },
  props: {
    operation: Property.StaticDropdown<string>({
      displayName: 'Operation',
      required: true,
      defaultValue: 'associate',
      options: { disabled: false, options: [{ label: 'Associate', value: 'associate' }, { label: 'Disassociate', value: 'disassociate' }] },
    }),
    entitySet: Property.ShortText({
      displayName: 'Entity Set',
      description: 'Entity set name (plural), for example contacts, accounts, leads or opportunities. Get it from List Entities.',
      required: true,
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'The record GUID. Get it from Search Records or a previous step.',
      required: true,
    }),
    navigationProperty: Property.ShortText({
      displayName: 'Navigation Property',
      description: 'Collection-valued navigation property on the first record, for example contact_customer_accounts.',
      required: true,
    }),
    relatedEntitySet: Property.ShortText({
      displayName: 'Related Entity Set',
      description: 'Entity set of the related record, for example contacts.',
      required: true,
    }),
    relatedRecordId: Property.ShortText({
      displayName: 'Related Record ID',
      description: 'GUID of the related record.',
      required: true,
    }),
  },
  outputSchema: associateOutputSchema,
  async run(context) {
    const { operation, entitySet, recordId, navigationProperty, relatedEntitySet, relatedRecordId } = context.propsValue;
    if (operation !== 'associate' && operation !== 'disassociate') {
      throw new Error('Operation must be associate or disassociate.');
    }
    const id = odata.requireGuid({ value: recordId, label: 'Record ID' });
    const relatedId = odata.requireGuid({ value: relatedRecordId, label: 'Related record ID' });
    const relatedSet = odata.requireIdentifier({ value: relatedEntitySet, label: 'Related entity set' });
    const client = makeClient(context.auth);
    if (operation === 'associate') {
      await client.associate({ entitySet, recordId: id, navigationProperty, relatedEntitySet: relatedSet, relatedRecordId: relatedId });
    } else {
      await client.disassociate({ entitySet, recordId: id, navigationProperty, relatedRecordId: relatedId });
    }
    return {
      success: true,
      operation,
      entitySet,
      recordId: id,
      navigationProperty,
      relatedEntitySet: relatedSet,
      relatedRecordId: relatedId,
    };
  },
});
