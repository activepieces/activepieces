import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mailchimpCommon } from './lib/common';
import { addMemberToList } from './lib/actions/add-member-to-list';
import { addNoteToSubscriber } from './lib/actions/add-note-to-subscriber';
import { removeSubscriberFromTag } from './lib/actions/remove-subscriber-from-tag';
import { updateSubscriberInList } from './lib/actions/update-subscriber-status';
import { addSubscriberToTag } from './lib/actions/add-subscriber-to-tag';
import { createCampaign } from './lib/actions/create-campaign';
import { getCampaignReport } from './lib/actions/get-campaign-report';
import { createAudience } from './lib/actions/create-audience';
import { archiveSubscriber } from './lib/actions/archive-subscriber';
import { unsubscribeEmail } from './lib/actions/unsubscribe-email';
import { findCampaign } from './lib/actions/find-campaign';
import { findCustomer } from './lib/actions/find-customer';
import { findTag } from './lib/actions/find-tag';
import { findSubscriber } from './lib/actions/find-subscriber';
import { createTag } from './lib/actions/create-tag';
import { sendCampaign } from './lib/actions/send-campaign';
import { createCustomEvent } from './lib/actions/create-custom-event';
import { listAudiences } from './lib/actions/list-audiences';
import { getAudience } from './lib/actions/get-audience';
import { listMembers } from './lib/actions/list-members';
import { searchMembers } from './lib/actions/search-members';
import { getMemberTags } from './lib/actions/get-member-tags';
import { getMemberActivity } from './lib/actions/get-member-activity';
import { deleteMemberPermanently } from './lib/actions/delete-member-permanently';
import { listMergeFields } from './lib/actions/list-merge-fields';
import { listInterestCategories } from './lib/actions/list-interest-categories';
import { listSegments } from './lib/actions/list-segments';
import { addMemberToSegment } from './lib/actions/add-member-to-segment';
import { removeMemberFromSegment } from './lib/actions/remove-member-from-segment';
import { listCampaigns } from './lib/actions/list-campaigns';
import { getCampaignContent } from './lib/actions/get-campaign-content';
import { setCampaignContent } from './lib/actions/set-campaign-content';
import { sendTestEmail } from './lib/actions/send-test-email';
import { replicateCampaign } from './lib/actions/replicate-campaign';
import { deleteCampaign } from './lib/actions/delete-campaign';
import { scheduleCampaign } from './lib/actions/schedule-campaign';
import { unscheduleCampaign } from './lib/actions/unschedule-campaign';
import { listTemplates } from './lib/actions/list-templates';
import { upsertMemberAi } from './lib/actions/ai/upsert-member';
import { updateMemberProfileAi } from './lib/actions/ai/update-member-profile';
import { setMemberStatusAi } from './lib/actions/ai/set-member-status';
import { getMemberAi } from './lib/actions/ai/get-member';
import { createCampaignDraftAi } from './lib/actions/ai/create-campaign-draft';
import { getCampaignStatsAi } from './lib/actions/ai/get-campaign-stats';
import { resolveAudienceAi } from './lib/actions/ai/resolve-audience';
import { resolveSegmentAi } from './lib/actions/ai/resolve-segment';
import { resolveMergeFieldAi } from './lib/actions/ai/resolve-merge-field';
import { resolveInterestAi } from './lib/actions/ai/resolve-interest';

import { PieceCategory } from '@activepieces/pieces-framework';
import { mailChimpSubscribeTrigger } from './lib/triggers/subscribe-trigger';
import { mailChimpUnsubscriberTrigger } from './lib/triggers/unsubscribe-trigger';
import { mailChimpNewCampaignTrigger } from './lib/triggers/new-campaign-trigger';
import { mailChimpLinkClickedTrigger } from './lib/triggers/link-clicked-trigger';
import { mailChimpEmailOpenedTrigger } from './lib/triggers/email-opened-trigger';
import { mailChimpSubscriberUpdatedTrigger } from './lib/triggers/subscriber-updated-trigger';
import { mailChimpNewCustomerTrigger } from './lib/triggers/new-customer-trigger';
import { mailChimpNewOrderTrigger } from './lib/triggers/new-order-trigger';
import { mailChimpNewSegmentTagSubscriberTrigger } from './lib/triggers/new-segment-tag-subscriber-trigger';

export const mailchimpAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://login.mailchimp.com/oauth2/authorize',
  tokenUrl: 'https://login.mailchimp.com/oauth2/token',
  required: true,
  scope: [],
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest<MailchimpMetadata>({
        method: HttpMethod.GET,
        url: 'https://login.mailchimp.com/oauth2/metadata',
        headers: { Authorization: `OAuth ${auth.access_token}` },
        timeout: 5000,
      });
      const metadata = response.body;
      return (
        metadata.login?.email ||
        metadata.login?.login_email ||
        metadata.accountname ||
        undefined
      );
    } catch {
      return undefined;
    }
  },
});

export const mailchimp = createPiece({
  displayName: 'Mailchimp',
  description: 'All-in-One integrated marketing platform for managing audiences, sending campaigns, tracking engagement, and automating lifecycle communications.',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/mailchimp.png',
  authors: ["abdullahranginwala","TaskMagicKyle","kishanprmr","AbdulTheActivePiecer","khaledmashaly","abuaboud", "sparkybug", "onyedikachi-david"],
  categories: [PieceCategory.MARKETING],
  auth: mailchimpAuth,
  actions: [
    addMemberToList,
    addNoteToSubscriber,
    addSubscriberToTag,
    removeSubscriberFromTag,
    updateSubscriberInList,
    createCampaign,
    getCampaignReport,
    createAudience,
    archiveSubscriber,
    unsubscribeEmail,
    findCampaign,
    findCustomer,
    findTag,
    findSubscriber,
    createTag,
    sendCampaign,
    createCustomEvent,
    listAudiences,
    getAudience,
    listMembers,
    searchMembers,
    getMemberTags,
    getMemberActivity,
    deleteMemberPermanently,
    listMergeFields,
    listInterestCategories,
    listSegments,
    addMemberToSegment,
    removeMemberFromSegment,
    listCampaigns,
    getCampaignContent,
    setCampaignContent,
    sendTestEmail,
    replicateCampaign,
    deleteCampaign,
    scheduleCampaign,
    unscheduleCampaign,
    listTemplates,
    mailchimpCustomApiCall(),
    upsertMemberAi,
    updateMemberProfileAi,
    setMemberStatusAi,
    getMemberAi,
    createCampaignDraftAi,
    getCampaignStatsAi,
    resolveAudienceAi,
    resolveSegmentAi,
    resolveMergeFieldAi,
    resolveInterestAi,
  ],
  triggers: [
    mailChimpSubscribeTrigger, 
    mailChimpUnsubscriberTrigger,
    mailChimpNewCampaignTrigger,
    mailChimpLinkClickedTrigger,
    mailChimpEmailOpenedTrigger,
    mailChimpSubscriberUpdatedTrigger,
    mailChimpNewCustomerTrigger,
    mailChimpNewOrderTrigger,
    mailChimpNewSegmentTagSubscriberTrigger,
  ],
});

function mailchimpCustomApiCall() {
  const base = createCustomApiCallAction({
    auth: mailchimpAuth,
    baseUrl: () => 'https://<dc>.api.mailchimp.com/3.0',
    authMapping: async (auth) => ({
      Authorization: `Bearer ${auth.access_token}`,
    }),
    props: {
      url: {
        description:
          'A path relative to your account data center, such as /lists or /campaigns. It is sent to https://<your dc>.api.mailchimp.com/3.0.',
        defaultValue: '/lists',
      },
    },
  });
  return createAction({
    auth: mailchimpAuth,
    name: base.name,
    displayName: base.displayName,
    description: base.description,
    audience: 'human',
    classification: 'WRITE',
    props: base.props,
    propertyGroups: base.propertyGroups,
    async run(context) {
      const server = await mailchimpCommon.getMailChimpServerPrefix(context.auth.access_token);
      const rawUrl = context.propsValue.url['url'];
      const path = typeof rawUrl === 'string' ? rawUrl.trim() : '';
      if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
        throw new Error('Use a path such as /lists; the Mailchimp data center URL is added for you.');
      }
      const relative = path.replace(/^\/?(3\.0\/)?/, '');
      return base.run({
        ...context,
        propsValue: {
          ...context.propsValue,
          url: { ...context.propsValue.url, url: `https://${server}.api.mailchimp.com/3.0/${relative}` },
        },
      });
    },
  });
}

type MailchimpMetadata = {
  accountname?: string;
  login?: { email?: string; login_email?: string };
};
