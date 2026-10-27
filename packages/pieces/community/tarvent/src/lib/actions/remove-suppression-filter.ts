import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventClient } from '../common/client';
import { tarventTransport } from '../common/transport';
import { tarventOutputSchemas } from '../output-schemas';

export const removeSuppressionFilter = createAction({
  auth: tarventAuth,
  name: 'tarvent_remove_suppression_filter',
  classification: 'WRITE',
  displayName: 'Remove From Suppression List',
  description: 'Removes an email address from your account suppression list.',
  audience: 'human',
  aiMetadata: {
    description:
      'Removes an email address from the Tarvent account-level suppression list so it can receive email again. Give the email address (every filter that exactly matches it is removed) or a suppression filter ID. Returns the removed filter IDs; removed=0 means nothing matched. Idempotent: a second call finds nothing left to remove.',
    idempotent: true,
  },
  outputSchema: tarventOutputSchemas.suppressionRemoved,
  props: {
    email: Property.ShortText({ displayName: 'Email address', description: 'Remove filters for this exact email address.', required: false }),
    filterId: Property.ShortText({ displayName: 'Suppression filter ID', description: 'Or remove one filter by its ID.', required: false }),
  },
  async run(context) {
    const auth = context.auth.props;
    const email = tarventCommon.trimmed(context.propsValue.email);
    const filterId = tarventCommon.trimmed(context.propsValue.filterId);
    if ((email === undefined) === (filterId === undefined)) {
      throw new Error('Enter either Email address or Suppression filter ID (exactly one).');
    }
    const ids = filterId ? [filterId] : await idsForEmail({ auth, email: email ?? '' });
    const removed = [];
    for (const id of ids) {
      try {
        await tarventClient.booleanMutation({
          auth,
          operation: 'DeleteSuppressionFilter',
          field: 'deleteAccountSuppressionFilter',
          argDefs: '$id: String!',
          args: 'id: $id',
          variables: { id },
        });
        removed.push(id);
      } catch (error) {
        if (!tarventClient.isNotFound(error)) {
          throw error;
        }
      }
    }
    return { removed: removed.length, filterIds: removed };
  },
});

async function idsForEmail({ auth, email }: { auth: Parameters<typeof tarventTransport.graphql>[0]['auth']; email: string }): Promise<string[]> {
  const { localPart, domain } = tarventCommon.splitEmail(email);
  const { items, truncated } = await tarventClient.listAll<{ id: string; localPart?: string | null; domain?: string | null }>({
    auth,
    operation: 'FindSuppressionFilters',
    field: 'accountSuppressionFilters',
    selection: 'id localPart domain',
    argDefs: ', $where: AccountSuppressionFilterFilterInput',
    args: ', where: $where',
    variables: { where: { and: [{ localPart: { eq: localPart } }, { domain: { eq: domain } }] } },
  });
  if (truncated) {
    throw new Error('Too many suppression filters match this email. Remove them by filter ID instead.');
  }
  return items
    .filter((f) => (f.localPart ?? '').toLowerCase() === localPart.toLowerCase() && (f.domain ?? '').toLowerCase() === domain.toLowerCase())
    .map((f) => f.id);
}
