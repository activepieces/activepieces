import { createContactPersonAction } from './contact-persons/create-contact-person';
import { deleteContactPersonAction } from './contact-persons/delete-contact-person';
import { getContactPersonAction } from './contact-persons/get-contact-person';
import { listContactPersonsAction } from './contact-persons/list-contact-persons';
import { markContactPersonPrimaryAction } from './contact-persons/mark-contact-person-primary';
import { updateContactPersonAction } from './contact-persons/update-contact-person';
import { addContactAddressAction } from './contacts/add-contact-address';
import { addContactAttachmentAction } from './contacts/add-contact-attachment';
import { addContactCommentAction } from './contacts/add-contact-comment';
import { addContactTaxInfoAction } from './contacts/add-contact-tax-info';
import { assignContactOwnerAction } from './contacts/assign-contact-owner';
import { assignOwnerToContactsAction } from './contacts/assign-owner-to-contacts';
import { createContactAction } from './contacts/create-contact';
import { deleteContactAddressAction } from './contacts/delete-contact-address';
import { deleteContactCommentAction } from './contacts/delete-contact-comment';
import { deleteContactDocumentAction } from './contacts/delete-contact-document';
import { deleteContactTaxInfoAction } from './contacts/delete-contact-tax-info';
import { deleteContactAction } from './contacts/delete-contact';
import { deleteContactsAction } from './contacts/delete-contacts';
import { disableContactPaymentReminderAction } from './contacts/disable-contact-payment-reminder';
import { disableContactPortalAction } from './contacts/disable-contact-portal';
import { emailContactStatementAction } from './contacts/email-contact-statement';
import { emailContactAction } from './contacts/email-contact';
import { enableContactPaymentReminderAction } from './contacts/enable-contact-payment-reminder';
import { enableContactPortalAction } from './contacts/enable-contact-portal';
import { getContactByReferenceAction } from './contacts/get-contact-by-reference';
import { getContactClientReviewEmailContentAction } from './contacts/get-contact-client-review-email-content';
import { getContactDocumentAction } from './contacts/get-contact-document';
import { getContactEmailContentAction } from './contacts/get-contact-email-content';
import { getContactIncomeAndExpenseAction } from './contacts/get-contact-income-and-expense';
import { getContactInventorySummaryAction } from './contacts/get-contact-inventory-summary';
import { getContactOpeningBalancesAction } from './contacts/get-contact-opening-balances';
import { getContactProfitAndLossAction } from './contacts/get-contact-profit-and-loss';
import { getContactStatementEmailContentAction } from './contacts/get-contact-statement-email-content';
import { getContactStatementAction } from './contacts/get-contact-statement';
import { getContactUnusedCreditsAction } from './contacts/get-contact-unused-credits';
import { getContactUnusedRetainerPaymentsAction } from './contacts/get-contact-unused-retainer-payments';
import { getContactVendorStatementEmailContentAction } from './contacts/get-contact-vendor-statement-email-content';
import { getContactAction } from './contacts/get-contact';
import { inviteContactPersonToPortalAction } from './contacts/invite-contact-person-to-portal';
import { listAllContactAddressesAction } from './contacts/list-all-contact-addresses';
import { listAllContactPersonsAction } from './contacts/list-all-contact-persons';
import { listContactAddressesAction } from './contacts/list-contact-addresses';
import { listContactCommentsAction } from './contacts/list-contact-comments';
import { listContactCreditNoteRefundsAction } from './contacts/list-contact-credit-note-refunds';
import { listContactPaymentRefundsAction } from './contacts/list-contact-payment-refunds';
import { listContactTaxInfoAction } from './contacts/list-contact-tax-info';
import { listContactsAction } from './contacts/list-contacts';
import { markContactActiveAction } from './contacts/mark-contact-active';
import { markContactAddressAsBillingAction } from './contacts/mark-contact-address-as-billing';
import { markContactAddressAsShippingAction } from './contacts/mark-contact-address-as-shipping';
import { markContactInactiveAction } from './contacts/mark-contact-inactive';
import { mergeContactsAction } from './contacts/merge-contacts';
import { removeContactTagAction } from './contacts/remove-contact-tag';
import { resendContactPersonPortalInviteAction } from './contacts/resend-contact-person-portal-invite';
import { restoreContactDocumentsAction } from './contacts/restore-contact-documents';
import { sendContactClientReviewEmailAction } from './contacts/send-contact-client-review-email';
import { sendContactVendorStatementEmailAction } from './contacts/send-contact-vendor-statement-email';
import { trackContact1099Action } from './contacts/track-contact-1099';
import { trackContacts1099Action } from './contacts/track-contacts-1099';
import { untrackContact1099Action } from './contacts/untrack-contact-1099';
import { updateContactAddressAction } from './contacts/update-contact-address';
import { updateContactDocumentAction } from './contacts/update-contact-document';
import { updateContactTagsAction } from './contacts/update-contact-tags';
import { updateContactTaxInfoAction } from './contacts/update-contact-tax-info';
import { updateContactAction } from './contacts/update-contact';
import { upsertContactByCustomFieldAction } from './contacts/upsert-contact-by-custom-field';
import { validateAddressFieldsAction } from './contacts/validate-address-fields';
import { verifyContactAddressAction } from './contacts/verify-contact-address';
import { createCustomerPaymentRefundAction } from './customer-payments/create-customer-payment-refund';
import { createCustomerPaymentAction } from './customer-payments/create-customer-payment';
import { deleteCustomerPaymentRefundAction } from './customer-payments/delete-customer-payment-refund';
import { deleteCustomerPaymentAction } from './customer-payments/delete-customer-payment';
import { deleteCustomerPaymentsAction } from './customer-payments/delete-customer-payments';
import { getCustomerPaymentRefundAction } from './customer-payments/get-customer-payment-refund';
import { getCustomerPaymentAction } from './customer-payments/get-customer-payment';
import { listCustomerPaymentRefundsAction } from './customer-payments/list-customer-payment-refunds';
import { listCustomerPaymentsAction } from './customer-payments/list-customer-payments';
import { updateCustomerPaymentCustomFieldsAction } from './customer-payments/update-customer-payment-custom-fields';
import { updateCustomerPaymentRefundAction } from './customer-payments/update-customer-payment-refund';
import { updateCustomerPaymentAction } from './customer-payments/update-customer-payment';
import { upsertCustomerPaymentByCustomFieldAction } from './customer-payments/upsert-customer-payment-by-custom-field';
import { addInvoiceAttachmentAction } from './invoices/add-invoice-attachment';
import { addInvoiceCommentAction } from './invoices/add-invoice-comment';
import { applyCreditsToInvoiceAction } from './invoices/apply-credits-to-invoice';
import { applyInvoiceSubstatusAction } from './invoices/apply-invoice-substatus';
import { applyPricebookToInvoiceAction } from './invoices/apply-pricebook-to-invoice';
import { approveInvoiceAction } from './invoices/approve-invoice';
import { approveInvoicesAction } from './invoices/approve-invoices';
import { attachDocumentToInvoiceAction } from './invoices/attach-document-to-invoice';
import { cancelInvoiceWriteOffAction } from './invoices/cancel-invoice-write-off';
import { cancelInvoiceAction } from './invoices/cancel-invoice';
import { cancelScheduledInvoiceEmailAction } from './invoices/cancel-scheduled-invoice-email';
import { createInvoiceFromSalesOrderAction } from './invoices/create-invoice-from-sales-order';
import { createInvoicePaymentLinkAction } from './invoices/create-invoice-payment-link';
import { createInvoiceAction } from './invoices/create-invoice';
import { createInvoicesFromEstimatesAction } from './invoices/create-invoices-from-estimates';
import { createInvoicesFromProjectsAction } from './invoices/create-invoices-from-projects';
import { deleteInvoiceAppliedCreditAction } from './invoices/delete-invoice-applied-credit';
import { deleteInvoiceAttachmentAction } from './invoices/delete-invoice-attachment';
import { deleteInvoiceCommentAction } from './invoices/delete-invoice-comment';
import { deleteInvoiceDocumentAction } from './invoices/delete-invoice-document';
import { deleteInvoiceLineItemAction } from './invoices/delete-invoice-line-item';
import { deleteInvoicePaymentAction } from './invoices/delete-invoice-payment';
import { deleteInvoiceAction } from './invoices/delete-invoice';
import { deleteInvoicesAction } from './invoices/delete-invoices';
import { disableInvoicePaymentReminderAction } from './invoices/disable-invoice-payment-reminder';
import { emailInvoicePdfAction } from './invoices/email-invoice-pdf';
import { emailInvoiceAction } from './invoices/email-invoice';
import { emailInvoicesAction } from './invoices/email-invoices';
import { enableInvoicePaymentReminderAction } from './invoices/enable-invoice-payment-reminder';
import { exportInvoicesPdfAction } from './invoices/export-invoices-pdf';
import { finalizeInvoiceApprovalAction } from './invoices/finalize-invoice-approval';
import { getInvoiceAdvancedTrackingDetailsAction } from './invoices/get-invoice-advanced-tracking-details';
import { getInvoiceAttachmentAction } from './invoices/get-invoice-attachment';
import { getInvoiceByReferenceAction } from './invoices/get-invoice-by-reference';
import { getInvoiceCustomFieldsAction } from './invoices/get-invoice-custom-fields';
import { getInvoiceDashboardAction } from './invoices/get-invoice-dashboard';
import { getInvoiceDeliveryNotesAction } from './invoices/get-invoice-delivery-notes';
import { getInvoiceDocumentAction } from './invoices/get-invoice-document';
import { getInvoiceEmailContentAction } from './invoices/get-invoice-email-content';
import { getInvoiceMetadataAction } from './invoices/get-invoice-metadata';
import { getInvoicePackingSlipsAction } from './invoices/get-invoice-packing-slips';
import { getInvoicePaymentReminderEmailContentAction } from './invoices/get-invoice-payment-reminder-email-content';
import { getInvoiceQrCodeAction } from './invoices/get-invoice-qr-code';
import { getInvoiceAction } from './invoices/get-invoice';
import { linkInvoicesToSalesOrderAction } from './invoices/link-invoices-to-sales-order';
import { listInvoiceCommentsAction } from './invoices/list-invoice-comments';
import { listInvoiceCreditsAppliedAction } from './invoices/list-invoice-credits-applied';
import { listInvoicePaymentsAction } from './invoices/list-invoice-payments';
import { listInvoiceTemplatesAction } from './invoices/list-invoice-templates';
import { listInvoicesAction } from './invoices/list-invoices';
import { markInvoiceDraftAction } from './invoices/mark-invoice-draft';
import { markInvoiceSentAction } from './invoices/mark-invoice-sent';
import { markInvoicesSentAction } from './invoices/mark-invoices-sent';
import { markInvoicesShippedAction } from './invoices/mark-invoices-shipped';
import { previewInvoiceCouponsAction } from './invoices/preview-invoice-coupons';
import { printInvoiceDeliveryNoteAction } from './invoices/print-invoice-delivery-note';
import { printInvoicePackingSlipAction } from './invoices/print-invoice-packing-slip';
import { printInvoicesAction } from './invoices/print-invoices';
import { rejectInvoiceAction } from './invoices/reject-invoice';
import { removeInvoiceSubstatusAction } from './invoices/remove-invoice-substatus';
import { scheduleInvoiceEmailAction } from './invoices/schedule-invoice-email';
import { sendInvoiceDunningNotificationsAction } from './invoices/send-invoice-dunning-notifications';
import { sendInvoicePaymentReminderAction } from './invoices/send-invoice-payment-reminder';
import { sendInvoicePaymentRemindersAction } from './invoices/send-invoice-payment-reminders';
import { submitInvoiceAction } from './invoices/submit-invoice';
import { submitInvoicesAction } from './invoices/submit-invoices';
import { unlinkInvoicesFromSalesOrdersAction } from './invoices/unlink-invoices-from-sales-orders';
import { unshipInvoicesAction } from './invoices/unship-invoices';
import { updateInvoiceAdvancedTrackingDetailsAction } from './invoices/update-invoice-advanced-tracking-details';
import { updateInvoiceAttachmentPreferenceAction } from './invoices/update-invoice-attachment-preference';
import { updateInvoiceBillingAddressAction } from './invoices/update-invoice-billing-address';
import { updateInvoiceCommentAction } from './invoices/update-invoice-comment';
import { updateInvoiceCustomFieldsAction } from './invoices/update-invoice-custom-fields';
import { updateInvoiceMetadataAction } from './invoices/update-invoice-metadata';
import { updateInvoiceShippingAddressAction } from './invoices/update-invoice-shipping-address';
import { updateInvoiceTemplateAction } from './invoices/update-invoice-template';
import { updateInvoiceAction } from './invoices/update-invoice';
import { uploadInvoiceDocumentAction } from './invoices/upload-invoice-document';
import { upsertInvoiceByCustomFieldAction } from './invoices/upsert-invoice-by-custom-field';
import { voidInvoiceAction } from './invoices/void-invoice';
import { voidInvoicesAction } from './invoices/void-invoices';
import { writeOffInvoiceAction } from './invoices/write-off-invoice';
import { writeOffInvoicesAction } from './invoices/write-off-invoices';
import { createOrganizationAddressAction } from './organizations/create-organization-address';
import { deleteOrganizationAddressAction } from './organizations/delete-organization-address';
import { getOrganizationAddressAction } from './organizations/get-organization-address';
import { getOrganizationAction } from './organizations/get-organization';
import { listOrganizationsAction } from './organizations/list-organizations';
import { listUserOrganizationsAction } from './organizations/list-user-organizations';
import { updateOrganizationAddressAction } from './organizations/update-organization-address';
import { updateOrganizationAction } from './organizations/update-organization';

export const zohoBooksAiActions = [
  createContactPersonAction,
  deleteContactPersonAction,
  getContactPersonAction,
  listContactPersonsAction,
  markContactPersonPrimaryAction,
  updateContactPersonAction,
  addContactAddressAction,
  addContactAttachmentAction,
  addContactCommentAction,
  addContactTaxInfoAction,
  assignContactOwnerAction,
  assignOwnerToContactsAction,
  createContactAction,
  deleteContactAddressAction,
  deleteContactCommentAction,
  deleteContactDocumentAction,
  deleteContactTaxInfoAction,
  deleteContactAction,
  deleteContactsAction,
  disableContactPaymentReminderAction,
  disableContactPortalAction,
  emailContactStatementAction,
  emailContactAction,
  enableContactPaymentReminderAction,
  enableContactPortalAction,
  getContactByReferenceAction,
  getContactClientReviewEmailContentAction,
  getContactDocumentAction,
  getContactEmailContentAction,
  getContactIncomeAndExpenseAction,
  getContactInventorySummaryAction,
  getContactOpeningBalancesAction,
  getContactProfitAndLossAction,
  getContactStatementEmailContentAction,
  getContactStatementAction,
  getContactUnusedCreditsAction,
  getContactUnusedRetainerPaymentsAction,
  getContactVendorStatementEmailContentAction,
  getContactAction,
  inviteContactPersonToPortalAction,
  listAllContactAddressesAction,
  listAllContactPersonsAction,
  listContactAddressesAction,
  listContactCommentsAction,
  listContactCreditNoteRefundsAction,
  listContactPaymentRefundsAction,
  listContactTaxInfoAction,
  listContactsAction,
  markContactActiveAction,
  markContactAddressAsBillingAction,
  markContactAddressAsShippingAction,
  markContactInactiveAction,
  mergeContactsAction,
  removeContactTagAction,
  resendContactPersonPortalInviteAction,
  restoreContactDocumentsAction,
  sendContactClientReviewEmailAction,
  sendContactVendorStatementEmailAction,
  trackContact1099Action,
  trackContacts1099Action,
  untrackContact1099Action,
  updateContactAddressAction,
  updateContactDocumentAction,
  updateContactTagsAction,
  updateContactTaxInfoAction,
  updateContactAction,
  upsertContactByCustomFieldAction,
  validateAddressFieldsAction,
  verifyContactAddressAction,
  createCustomerPaymentRefundAction,
  createCustomerPaymentAction,
  deleteCustomerPaymentRefundAction,
  deleteCustomerPaymentAction,
  deleteCustomerPaymentsAction,
  getCustomerPaymentRefundAction,
  getCustomerPaymentAction,
  listCustomerPaymentRefundsAction,
  listCustomerPaymentsAction,
  updateCustomerPaymentCustomFieldsAction,
  updateCustomerPaymentRefundAction,
  updateCustomerPaymentAction,
  upsertCustomerPaymentByCustomFieldAction,
  addInvoiceAttachmentAction,
  addInvoiceCommentAction,
  applyCreditsToInvoiceAction,
  applyInvoiceSubstatusAction,
  applyPricebookToInvoiceAction,
  approveInvoiceAction,
  approveInvoicesAction,
  attachDocumentToInvoiceAction,
  cancelInvoiceWriteOffAction,
  cancelInvoiceAction,
  cancelScheduledInvoiceEmailAction,
  createInvoiceFromSalesOrderAction,
  createInvoicePaymentLinkAction,
  createInvoiceAction,
  createInvoicesFromEstimatesAction,
  createInvoicesFromProjectsAction,
  deleteInvoiceAppliedCreditAction,
  deleteInvoiceAttachmentAction,
  deleteInvoiceCommentAction,
  deleteInvoiceDocumentAction,
  deleteInvoiceLineItemAction,
  deleteInvoicePaymentAction,
  deleteInvoiceAction,
  deleteInvoicesAction,
  disableInvoicePaymentReminderAction,
  emailInvoicePdfAction,
  emailInvoiceAction,
  emailInvoicesAction,
  enableInvoicePaymentReminderAction,
  exportInvoicesPdfAction,
  finalizeInvoiceApprovalAction,
  getInvoiceAdvancedTrackingDetailsAction,
  getInvoiceAttachmentAction,
  getInvoiceByReferenceAction,
  getInvoiceCustomFieldsAction,
  getInvoiceDashboardAction,
  getInvoiceDeliveryNotesAction,
  getInvoiceDocumentAction,
  getInvoiceEmailContentAction,
  getInvoiceMetadataAction,
  getInvoicePackingSlipsAction,
  getInvoicePaymentReminderEmailContentAction,
  getInvoiceQrCodeAction,
  getInvoiceAction,
  linkInvoicesToSalesOrderAction,
  listInvoiceCommentsAction,
  listInvoiceCreditsAppliedAction,
  listInvoicePaymentsAction,
  listInvoiceTemplatesAction,
  listInvoicesAction,
  markInvoiceDraftAction,
  markInvoiceSentAction,
  markInvoicesSentAction,
  markInvoicesShippedAction,
  previewInvoiceCouponsAction,
  printInvoiceDeliveryNoteAction,
  printInvoicePackingSlipAction,
  printInvoicesAction,
  rejectInvoiceAction,
  removeInvoiceSubstatusAction,
  scheduleInvoiceEmailAction,
  sendInvoiceDunningNotificationsAction,
  sendInvoicePaymentReminderAction,
  sendInvoicePaymentRemindersAction,
  submitInvoiceAction,
  submitInvoicesAction,
  unlinkInvoicesFromSalesOrdersAction,
  unshipInvoicesAction,
  updateInvoiceAdvancedTrackingDetailsAction,
  updateInvoiceAttachmentPreferenceAction,
  updateInvoiceBillingAddressAction,
  updateInvoiceCommentAction,
  updateInvoiceCustomFieldsAction,
  updateInvoiceMetadataAction,
  updateInvoiceShippingAddressAction,
  updateInvoiceTemplateAction,
  updateInvoiceAction,
  uploadInvoiceDocumentAction,
  upsertInvoiceByCustomFieldAction,
  voidInvoiceAction,
  voidInvoicesAction,
  writeOffInvoiceAction,
  writeOffInvoicesAction,
  createOrganizationAddressAction,
  deleteOrganizationAddressAction,
  getOrganizationAddressAction,
  getOrganizationAction,
  listOrganizationsAction,
  listUserOrganizationsAction,
  updateOrganizationAddressAction,
  updateOrganizationAction,
];
