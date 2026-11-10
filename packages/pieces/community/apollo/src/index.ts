import { createPiece } from '@activepieces/pieces-framework';
import { apolloAuth } from './lib/auth';
import { apolloCustomApiCall } from './lib/actions/custom-api-call';
import { matchPerson } from './lib/actions/match-person';
import { enrichCompany } from './lib/actions/enrich-company';
import { newsArticlesSearch } from './lib/actions/news-articles-search';
import { organizationJobPostings } from './lib/actions/organization-job-postings';
import { organizationSearch } from './lib/actions/organization-search';
import { peopleSearch } from './lib/actions/people-search';
import { createContactAction } from './lib/actions/create-contact';
import { updateContactAction } from './lib/actions/update-contact';
import { findContactAction } from './lib/actions/find-contact';
import { createAccountAction } from './lib/actions/create-account';
import { updateAccountAction } from './lib/actions/update-account';
import { createDealAction } from './lib/actions/create-deal';
import { createTaskAction } from './lib/actions/create-task';
import { addContactToSequenceAction } from './lib/actions/add-contact-to-sequence';
import { aiAddContactsToSequenceAction } from './lib/actions/ai/add-contacts-to-sequence';
import { aiAddToListAction } from './lib/actions/ai/add-to-list';
import { aiCreateAccountAction } from './lib/actions/ai/create-account';
import { aiCreateContactAction } from './lib/actions/ai/create-contact';
import { aiCreateDealAction } from './lib/actions/ai/create-deal';
import { aiCreateListAction } from './lib/actions/ai/create-list';
import { aiCreateTaskAction } from './lib/actions/ai/create-task';
import { aiEnrichOrganizationAction } from './lib/actions/ai/enrich-organization';
import { aiEnrichPersonAction } from './lib/actions/ai/enrich-person';
import { aiFindContactByEmailAction } from './lib/actions/ai/find-contact-by-email';
import { aiGetAccountAction } from './lib/actions/ai/get-account';
import { aiGetContactAction } from './lib/actions/ai/get-contact';
import { aiGetCreditUsageAction } from './lib/actions/ai/get-credit-usage';
import { aiGetDealAction } from './lib/actions/ai/get-deal';
import { aiGetEmailContentAction } from './lib/actions/ai/get-email-content';
import { aiGetEmailSendStatusAction } from './lib/actions/ai/get-email-send-status';
import { aiGetTaskAction } from './lib/actions/ai/get-task';
import { aiListAccountStagesAction } from './lib/actions/ai/list-account-stages';
import { aiListContactStagesAction } from './lib/actions/ai/list-contact-stages';
import { aiListCustomFieldsAction } from './lib/actions/ai/list-custom-fields';
import { aiListDealStagesAction } from './lib/actions/ai/list-deal-stages';
import { aiListDealsAction } from './lib/actions/ai/list-deals';
import { aiListEmailAccountsAction } from './lib/actions/ai/list-email-accounts';
import { aiListJobPostingsAction } from './lib/actions/ai/list-job-postings';
import { aiListListsAction } from './lib/actions/ai/list-lists';
import { aiListUsersAction } from './lib/actions/ai/list-users';
import { aiRemoveContactsFromSequenceAction } from './lib/actions/ai/remove-contacts-from-sequence';
import { aiRemoveFromListAction } from './lib/actions/ai/remove-from-list';
import { aiSearchAccountsAction } from './lib/actions/ai/search-accounts';
import { aiSearchCallsAction } from './lib/actions/ai/search-calls';
import { aiSearchContactsAction } from './lib/actions/ai/search-contacts';
import { aiSearchNewsAction } from './lib/actions/ai/search-news';
import { aiSearchOrganizationsAction } from './lib/actions/ai/search-organizations';
import { aiSearchOutreachEmailsAction } from './lib/actions/ai/search-outreach-emails';
import { aiSearchPeopleAction } from './lib/actions/ai/search-people';
import { aiSearchSequencesAction } from './lib/actions/ai/search-sequences';
import { aiSearchTasksAction } from './lib/actions/ai/search-tasks';
import { aiUpdateAccountAction } from './lib/actions/ai/update-account';
import { aiUpdateContactAction } from './lib/actions/ai/update-contact';
import { aiUpdateDealAction } from './lib/actions/ai/update-deal';
import { aiUpdateListAction } from './lib/actions/ai/update-list';
import { newContactTrigger } from './lib/triggers/new-contact';
import { updatedContactTrigger } from './lib/triggers/updated-contact';
import { newAccountTrigger } from './lib/triggers/new-account';

export const apollo = createPiece({
  displayName: 'Apollo',
  auth: apolloAuth,
  description:
    'AI sales platform for prospecting, lead gen, and deal automation. Close more deals, faster, with smart data.',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/apollo.png',
  authors: ['abuaboud', 'sanket-a11y'],
  actions: [
    matchPerson,
    enrichCompany,
    newsArticlesSearch,
    organizationJobPostings,
    organizationSearch,
    peopleSearch,
    createContactAction,
    updateContactAction,
    findContactAction,
    createAccountAction,
    updateAccountAction,
    createDealAction,
    createTaskAction,
    addContactToSequenceAction,
    aiAddContactsToSequenceAction,
    aiAddToListAction,
    aiCreateAccountAction,
    aiCreateContactAction,
    aiCreateDealAction,
    aiCreateListAction,
    aiCreateTaskAction,
    aiEnrichOrganizationAction,
    aiEnrichPersonAction,
    aiFindContactByEmailAction,
    aiGetAccountAction,
    aiGetContactAction,
    aiGetCreditUsageAction,
    aiGetDealAction,
    aiGetEmailContentAction,
    aiGetEmailSendStatusAction,
    aiGetTaskAction,
    aiListAccountStagesAction,
    aiListContactStagesAction,
    aiListCustomFieldsAction,
    aiListDealStagesAction,
    aiListDealsAction,
    aiListEmailAccountsAction,
    aiListJobPostingsAction,
    aiListListsAction,
    aiListUsersAction,
    aiRemoveContactsFromSequenceAction,
    aiRemoveFromListAction,
    aiSearchAccountsAction,
    aiSearchCallsAction,
    aiSearchContactsAction,
    aiSearchNewsAction,
    aiSearchOrganizationsAction,
    aiSearchOutreachEmailsAction,
    aiSearchPeopleAction,
    aiSearchSequencesAction,
    aiSearchTasksAction,
    aiUpdateAccountAction,
    aiUpdateContactAction,
    aiUpdateDealAction,
    aiUpdateListAction,
    apolloCustomApiCall,
  ],
  triggers: [
    newContactTrigger,
    updatedContactTrigger,
    newAccountTrigger,
  ],
});
