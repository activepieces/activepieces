import {
  createAction,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { flowluAuth } from '../../..';
import { flowluCommon, makeClient } from '../../common';
import { FlowluEntity, FlowluModule } from '../../common/constants';

export const deleteContactAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_delete_contact',
  displayName: 'Delete CRM Account(Contact)',
  description: 'Deletes an existing contact in CRM.',
  props: {
    id: flowluCommon.contact_id(true),
  },
  async run(context) {
    const id = context.propsValue.id!;
    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof flowluAuth>
    );
    return await client.deleteAction(
      FlowluModule.CRM,
      FlowluEntity.ACCOUNT,
      id
    );
  },
});
