import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { googleContactsAddContactAction } from './lib/action/create-contact';
import { googleContactsUpdateContactAction } from './lib/action/update-contact';
import { googleContactsSearchContactsAction } from './lib/action/search-contact';
import { googleContactsCreateContactAction } from './lib/action/create-contact-agent';
import { googleContactsUpdateContactFieldsAction } from './lib/action/update-contact-fields';
import { googleContactsSearchContactsAtomicAction } from './lib/action/search-contacts';
import { googleContactsGetContactAction } from './lib/action/get-contact';
import { googleContactsListContactsAction } from './lib/action/list-contacts';
import { googleContactsDeleteContactAction } from './lib/action/delete-contact';
import { googleContactsBatchGetContactsAction } from './lib/action/batch-get-contacts';
import { googleContactsBatchCreateContactsAction } from './lib/action/batch-create-contacts';
import { googleContactsBatchUpdateContactsAction } from './lib/action/batch-update-contacts';
import { googleContactsBatchDeleteContactsAction } from './lib/action/batch-delete-contacts';
import { googleContactsUpdateContactPhotoAction } from './lib/action/update-contact-photo';
import { googleContactsDeleteContactPhotoAction } from './lib/action/delete-contact-photo';
import { googleContactsListContactGroupsAction } from './lib/action/list-contact-groups';
import { googleContactsGetContactGroupAction } from './lib/action/get-contact-group';
import { googleContactsBatchGetContactGroupsAction } from './lib/action/batch-get-contact-groups';
import { googleContactsCreateContactGroupAction } from './lib/action/create-contact-group';
import { googleContactsUpdateContactGroupAction } from './lib/action/update-contact-group';
import { googleContactsDeleteContactGroupAction } from './lib/action/delete-contact-group';
import { googleContactsModifyContactGroupMembersAction } from './lib/action/modify-contact-group-members';
import { googleContactsCommon } from './lib/common';
import { googleContactNewOrUpdatedContact } from './lib/trigger/new-contact';
import { googleContactsAuth } from './lib/auth';

export const googleContacts = createPiece({
  minimumSupportedRelease: '0.87.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-contacts.png',
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    googleContactsAddContactAction,
    googleContactsUpdateContactAction,
    googleContactsSearchContactsAction,
    googleContactsCreateContactAction,
    googleContactsUpdateContactFieldsAction,
    googleContactsSearchContactsAtomicAction,
    googleContactsGetContactAction,
    googleContactsListContactsAction,
    googleContactsDeleteContactAction,
    googleContactsBatchGetContactsAction,
    googleContactsBatchCreateContactsAction,
    googleContactsBatchUpdateContactsAction,
    googleContactsBatchDeleteContactsAction,
    googleContactsUpdateContactPhotoAction,
    googleContactsDeleteContactPhotoAction,
    googleContactsListContactGroupsAction,
    googleContactsGetContactGroupAction,
    googleContactsBatchGetContactGroupsAction,
    googleContactsCreateContactGroupAction,
    googleContactsUpdateContactGroupAction,
    googleContactsDeleteContactGroupAction,
    googleContactsModifyContactGroupMembersAction,
    createCustomApiCallAction({
      baseUrl: () => googleContactsCommon.baseUrl,
      auth: googleContactsAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth).access_token}`,
      }),
    }),
  ],
  displayName: 'Google Contacts',
  description: 'Stay connected and organized',

  authors: [
    'Abdallah-Alwarawreh',
    'Salem-Alaa',
    'kishanprmr',
    'MoShizzle',
    'khaledmashaly',
    'abuaboud',
    'ikus060',
  ],
  triggers: [googleContactNewOrUpdatedContact],
  auth: googleContactsAuth,
});
