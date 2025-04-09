import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { OAuth2PropertyValue, PieceAuth, createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { hubSpotListsAddContactAction } from './lib/actions/add-contact-to-list-action'
import { addContactToWorkflowAction } from './lib/actions/add-contact-to-workflow'
import { createAssociationsAction } from './lib/actions/create-associations'
import { createBlogPostAction } from './lib/actions/create-blog-post'
import { createCompanyAction } from './lib/actions/create-company'
import { createContactAction } from './lib/actions/create-contact'
import { createCustomObjectAction } from './lib/actions/create-custom-object'
import { createDealAction } from './lib/actions/create-deal'
import { createLineItemAction } from './lib/actions/create-line-item'
import { createOrUpdateContactAction } from './lib/actions/create-or-update-contact'
import { createPageAction } from './lib/actions/create-page'
import { createProductAction } from './lib/actions/create-product'
import { createTicketAction } from './lib/actions/create-ticket'
import { deletePageAction } from './lib/actions/delete-page'
import { findAssociationsAction } from './lib/actions/find-associations'
import { findCompanyAction } from './lib/actions/find-company'
import { findContactAction } from './lib/actions/find-contact'
import { findCustomObjectAction } from './lib/actions/find-custom-object'
import { findDealAction } from './lib/actions/find-deal'
import { findLineItemAction } from './lib/actions/find-line-item'
import { findProductAction } from './lib/actions/find-product'
import { findTicketAction } from './lib/actions/find-ticket'
import { getCompanyAction } from './lib/actions/get-company'
import { getContactAction } from './lib/actions/get-contact'
import { getCustomObjectAction } from './lib/actions/get-custom-object'
import { getDealAction } from './lib/actions/get-deal'
import { getLineItemAction } from './lib/actions/get-line-item'
import { getOwnerByEmailAction } from './lib/actions/get-owner-by-email'
import { getOwnerByIdAction } from './lib/actions/get-owner-by-id'
import { getPageAction } from './lib/actions/get-page'
import { getPipelineStageDeatilsAction } from './lib/actions/get-pipeline-stage-details'
import { getProductAction } from './lib/actions/get-product'
import { getTicketAction } from './lib/actions/get-ticket'
import { removeAssociationsAction } from './lib/actions/remove-associations'
import { removeContactFromListAction } from './lib/actions/remove-contact-from-list'
import { removeEmailSubscriptionAction } from './lib/actions/remove-email-subscription'
import { updateCompanyAction } from './lib/actions/update-company'
import { updateContactAction } from './lib/actions/update-contact'
import { updateCustomObjectAction } from './lib/actions/update-custom-object'
import { updateDealAction } from './lib/actions/update-deal'
import { updateLineItemAction } from './lib/actions/update-line-item'
import { updateProductAction } from './lib/actions/update-product'
import { updateTicketAction } from './lib/actions/update-ticket'
import { uploadFileAction } from './lib/actions/upload-file'
import { dealStageUpdatedTrigger } from './lib/triggers/deal-stage-updated'
import { newEmailSubscriptionsTimelineTrigger } from './lib/triggers/email-subscriptions-timeline'
import { newBlogArticleTrigger } from './lib/triggers/new-blog-article'
import { newCompanyTrigger } from './lib/triggers/new-company'
import { newCompanyPropertyChangeTrigger } from './lib/triggers/new-company-propety-change'
import { newContactTrigger } from './lib/triggers/new-contact'
import { newContactInListTrigger } from './lib/triggers/new-contact-in-list'
import { newContactPropertyChangeTrigger } from './lib/triggers/new-contact-property-change'
import { newCustomObjectTrigger } from './lib/triggers/new-custom-object'
import { newCustomObjectPropertyChangeTrigger } from './lib/triggers/new-custom-object-property-change'
import { newDealTrigger } from './lib/triggers/new-deal'
import { newDealPropertyChangeTrigger } from './lib/triggers/new-deal-property-change'
import { newEmailEventTrigger } from './lib/triggers/new-email-event'
import { newEngagementTrigger } from './lib/triggers/new-engagement'
import { newFormSubmissionTrigger } from './lib/triggers/new-form-submission'
import { newLineItemTrigger } from './lib/triggers/new-line-item'
import { newOrUpdatedCompanyTrigger } from './lib/triggers/new-or-updated-company'
import { newOrUpdatedContactTrigger } from './lib/triggers/new-or-updated-contact'
import { newOrUpdatedLineItemTrigger } from './lib/triggers/new-or-updated-line-item'
import { newOrUpdatedProductTrigger } from './lib/triggers/new-or-updated-product'
import { newProductTrigger } from './lib/triggers/new-product'
import { newTaskTrigger } from './lib/triggers/new-task'
import { newTicketTrigger } from './lib/triggers/new-ticket'
import { newTicketPropertyChangeTrigger } from './lib/triggers/new-ticket-property-change'

export const hubspotAuth = PieceAuth.OAuth2({
  authUrl: 'https://app.hubspot.com/oauth/authorize',
  tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
  required: true,
  scope: [
    'crm.lists.read',
    'crm.lists.write',
    'crm.objects.companies.read',
    'crm.objects.companies.write',
    'crm.objects.contacts.read',
    'crm.objects.contacts.write',
    'crm.objects.custom.read',
    'crm.objects.custom.write',
    'crm.objects.deals.read',
    'crm.objects.deals.write',
    'crm.objects.line_items.read',
    'crm.objects.owners.read',
    'crm.schemas.companies.read',
    'crm.schemas.contacts.read',
    'crm.schemas.custom.read',
    'crm.schemas.deals.read',
    'crm.schemas.line_items.read',
    'automation',
    'e-commerce',
    'tickets',
    'content',
    'settings.currencies.read',
    'settings.users.read',
    'settings.users.teams.read',
    'files',
    'forms',
    // 'business_units_view.read'
  ],
})

export const hubspot = createPiece({
  displayName: 'HubSpot',
  description: 'Powerful CRM that offers tools for sales, customer service, and marketing automation.',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/hubspot.png',
  authors: ['Salem-Alaa', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud'],
  categories: [PieceCategory.SALES_AND_CRM],
  auth: hubspotAuth,
  actions: [
    hubSpotListsAddContactAction,
    addContactToWorkflowAction,
    createAssociationsAction,
    createCompanyAction,
    createContactAction,
    createBlogPostAction,
    createCustomObjectAction,
    createDealAction,
    createLineItemAction,
    createPageAction,
    createOrUpdateContactAction,
    createProductAction,
    createTicketAction,
    getCompanyAction,
    getContactAction,
    getCustomObjectAction,
    getDealAction,
    getLineItemAction,
    getProductAction,
    getPageAction,
    getTicketAction,
    deletePageAction,
    removeAssociationsAction,
    removeContactFromListAction,
    removeEmailSubscriptionAction,
    updateCompanyAction,
    updateContactAction,
    updateCustomObjectAction,
    updateDealAction,
    updateLineItemAction,
    updateProductAction,
    updateTicketAction,
    uploadFileAction,
    findAssociationsAction,
    findCompanyAction,
    findContactAction,
    findCustomObjectAction,
    findDealAction,
    findLineItemAction,
    findProductAction,
    findTicketAction,
    getOwnerByEmailAction,
    getOwnerByIdAction,
    getPipelineStageDeatilsAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.hubapi.com',
      auth: hubspotAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [
    newOrUpdatedCompanyTrigger,
    newOrUpdatedContactTrigger,
    newDealPropertyChangeTrigger,
    newEmailSubscriptionsTimelineTrigger,
    newOrUpdatedLineItemTrigger,
    newCompanyTrigger,
    newCompanyPropertyChangeTrigger,
    newContactTrigger,
    newContactInListTrigger,
    newContactPropertyChangeTrigger,
    newBlogArticleTrigger,
    newCustomObjectTrigger,
    newCustomObjectPropertyChangeTrigger,
    newDealTrigger,
    newEmailEventTrigger,
    newEngagementTrigger,
    newFormSubmissionTrigger,
    newLineItemTrigger,
    newProductTrigger,
    newTicketTrigger,
    newTicketPropertyChangeTrigger,
    newOrUpdatedProductTrigger,
    newTaskTrigger,
    dealStageUpdatedTrigger,
  ],
})
