import { addContactAddressAction } from './contacts/add-contact-address';
import { createContactAction } from './contacts/create-contact';
import { createContactPersonAction } from './contacts/create-contact-person';
import { deleteContactAction } from './contacts/delete-contact';
import { deleteContactAddressAction } from './contacts/delete-contact-address';
import { deleteContactPersonAction } from './contacts/delete-contact-person';
import { disableContactPaymentRemindersAction } from './contacts/disable-contact-payment-reminders';
import { emailContactAction } from './contacts/email-contact';
import { emailContactStatementAction } from './contacts/email-contact-statement';
import { enableContactPaymentRemindersAction } from './contacts/enable-contact-payment-reminders';
import { enableContactPortalAccessAction } from './contacts/enable-contact-portal-access';
import { getContactAction } from './contacts/get-contact';
import { getContactPersonAction } from './contacts/get-contact-person';
import { getContactStatementEmailContentAction } from './contacts/get-contact-statement-email-content';
import { listContactAddressesAction } from './contacts/list-contact-addresses';
import { listContactCommentsAction } from './contacts/list-contact-comments';
import { listContactPersonsAction } from './contacts/list-contact-persons';
import { listContactRefundsAction } from './contacts/list-contact-refunds';
import { listContactsAction } from './contacts/list-contacts';
import { markContactActiveAction } from './contacts/mark-contact-active';
import { markContactInactiveAction } from './contacts/mark-contact-inactive';
import { markContactPersonPrimaryAction } from './contacts/mark-contact-person-primary';
import { updateContactAction } from './contacts/update-contact';
import { updateContactAddressAction } from './contacts/update-contact-address';
import { updateContactPersonAction } from './contacts/update-contact-person';
import { addCreditNoteCommentAction } from './credit-notes/add-credit-note-comment';
import { applyCreditNoteToInvoicesAction } from './credit-notes/apply-credit-note-to-invoices';
import { createCreditNoteAction } from './credit-notes/create-credit-note';
import { deleteCreditNoteAction } from './credit-notes/delete-credit-note';
import { deleteCreditNoteCommentAction } from './credit-notes/delete-credit-note-comment';
import { deleteCreditNoteRefundAction } from './credit-notes/delete-credit-note-refund';
import { emailCreditNoteAction } from './credit-notes/email-credit-note';
import { getCreditNoteAction } from './credit-notes/get-credit-note';
import { getCreditNoteEmailHistoryAction } from './credit-notes/get-credit-note-email-history';
import { getCreditNoteRefundAction } from './credit-notes/get-credit-note-refund';
import { listAllCreditNoteRefundsAction } from './credit-notes/list-all-credit-note-refunds';
import { listCreditNoteCommentsAction } from './credit-notes/list-credit-note-comments';
import { listCreditNoteInvoicesAction } from './credit-notes/list-credit-note-invoices';
import { listCreditNoteRefundsAction } from './credit-notes/list-credit-note-refunds';
import { listCreditNoteTemplatesAction } from './credit-notes/list-credit-note-templates';
import { listCreditNotesAction } from './credit-notes/list-credit-notes';
import { refundCreditNoteAction } from './credit-notes/refund-credit-note';
import { removeCreditNoteFromInvoiceAction } from './credit-notes/remove-credit-note-from-invoice';
import { reopenCreditNoteAction } from './credit-notes/reopen-credit-note';
import { setCreditNoteTemplateAction } from './credit-notes/set-credit-note-template';
import { updateCreditNoteAction } from './credit-notes/update-credit-note';
import { updateCreditNoteRefundAction } from './credit-notes/update-credit-note-refund';
import { voidCreditNoteAction } from './credit-notes/void-credit-note';
import { createCustomerPaymentAction } from './customer-payments/create-customer-payment';
import { deleteCustomerPaymentAction } from './customer-payments/delete-customer-payment';
import { deleteCustomerPaymentRefundAction } from './customer-payments/delete-customer-payment-refund';
import { getCustomerPaymentAction } from './customer-payments/get-customer-payment';
import { getCustomerPaymentRefundAction } from './customer-payments/get-customer-payment-refund';
import { listCustomerPaymentRefundsAction } from './customer-payments/list-customer-payment-refunds';
import { listCustomerPaymentsAction } from './customer-payments/list-customer-payments';
import { refundCustomerPaymentAction } from './customer-payments/refund-customer-payment';
import { updateCustomerPaymentAction } from './customer-payments/update-customer-payment';
import { updateCustomerPaymentCustomFieldsAction } from './customer-payments/update-customer-payment-custom-fields';
import { updateCustomerPaymentRefundAction } from './customer-payments/update-customer-payment-refund';
import { addEstimateCommentAction } from './estimates/add-estimate-comment';
import { createEstimateAction } from './estimates/create-estimate';
import { deleteEstimateAction } from './estimates/delete-estimate';
import { deleteEstimateCommentAction } from './estimates/delete-estimate-comment';
import { emailEstimateAction } from './estimates/email-estimate';
import { emailMultipleEstimatesAction } from './estimates/email-multiple-estimates';
import { exportEstimatesPdfAction } from './estimates/export-estimates-pdf';
import { getEstimateAction } from './estimates/get-estimate';
import { getEstimateEmailContentAction } from './estimates/get-estimate-email-content';
import { listEstimateCommentsAction } from './estimates/list-estimate-comments';
import { listEstimateTemplatesAction } from './estimates/list-estimate-templates';
import { listEstimatesAction } from './estimates/list-estimates';
import { markEstimateAcceptedAction } from './estimates/mark-estimate-accepted';
import { markEstimateDeclinedAction } from './estimates/mark-estimate-declined';
import { markEstimateSentAction } from './estimates/mark-estimate-sent';
import { setEstimateTemplateAction } from './estimates/set-estimate-template';
import { updateEstimateAction } from './estimates/update-estimate';
import { updateEstimateBillingAddressAction } from './estimates/update-estimate-billing-address';
import { updateEstimateCommentAction } from './estimates/update-estimate-comment';
import { updateEstimateShippingAddressAction } from './estimates/update-estimate-shipping-address';
import { createExpenseAction } from './expenses/create-expense';
import { createExpenseCategoryAction } from './expenses/create-expense-category';
import { deleteExpenseAction } from './expenses/delete-expense';
import { deleteExpenseCategoryAction } from './expenses/delete-expense-category';
import { getExpenseAction } from './expenses/get-expense';
import { getExpenseCategoryAction } from './expenses/get-expense-category';
import { listExpenseCategoriesAction } from './expenses/list-expense-categories';
import { listExpenseHistoryAction } from './expenses/list-expense-history';
import { listExpensesAction } from './expenses/list-expenses';
import { markExpenseCategoryActiveAction } from './expenses/mark-expense-category-active';
import { markExpenseCategoryInactiveAction } from './expenses/mark-expense-category-inactive';
import { updateExpenseAction } from './expenses/update-expense';
import { updateExpenseCategoryAction } from './expenses/update-expense-category';
import { addInvoiceAttachmentAction } from './invoices/add-invoice-attachment';
import { addInvoiceCommentAction } from './invoices/add-invoice-comment';
import { applyCreditsToInvoiceAction } from './invoices/apply-credits-to-invoice';
import { cancelInvoiceWriteOffAction } from './invoices/cancel-invoice-write-off';
import { createInvoiceAction } from './invoices/create-invoice';
import { deleteInvoiceAction } from './invoices/delete-invoice';
import { deleteInvoiceAttachmentAction } from './invoices/delete-invoice-attachment';
import { deleteInvoiceCommentAction } from './invoices/delete-invoice-comment';
import { deleteInvoicePaymentAction } from './invoices/delete-invoice-payment';
import { disableInvoicePaymentReminderAction } from './invoices/disable-invoice-payment-reminder';
import { emailInvoiceAction } from './invoices/email-invoice';
import { enableInvoicePaymentReminderAction } from './invoices/enable-invoice-payment-reminder';
import { exportInvoicesPdfAction } from './invoices/export-invoices-pdf';
import { getInvoiceAction } from './invoices/get-invoice';
import { getInvoiceAttachmentAction } from './invoices/get-invoice-attachment';
import { getInvoiceEmailContentAction } from './invoices/get-invoice-email-content';
import { getInvoicePaymentReminderContentAction } from './invoices/get-invoice-payment-reminder-content';
import { listInvoiceCommentsAction } from './invoices/list-invoice-comments';
import { listInvoiceCreditsAppliedAction } from './invoices/list-invoice-credits-applied';
import { listInvoicePaymentsAction } from './invoices/list-invoice-payments';
import { listInvoiceTemplatesAction } from './invoices/list-invoice-templates';
import { listInvoicesAction } from './invoices/list-invoices';
import { markInvoiceDraftAction } from './invoices/mark-invoice-draft';
import { markInvoiceSentAction } from './invoices/mark-invoice-sent';
import { sendBulkInvoiceReminderAction } from './invoices/send-bulk-invoice-reminder';
import { sendInvoicePaymentReminderAction } from './invoices/send-invoice-payment-reminder';
import { setInvoiceTemplateAction } from './invoices/set-invoice-template';
import { updateInvoiceAction } from './invoices/update-invoice';
import { updateInvoiceBillingAddressAction } from './invoices/update-invoice-billing-address';
import { updateInvoiceCommentAction } from './invoices/update-invoice-comment';
import { updateInvoiceShippingAddressAction } from './invoices/update-invoice-shipping-address';
import { voidInvoiceAction } from './invoices/void-invoice';
import { writeOffInvoiceAction } from './invoices/write-off-invoice';
import { createItemAction } from './items/create-item';
import { deleteItemAction } from './items/delete-item';
import { getItemAction } from './items/get-item';
import { listItemsAction } from './items/list-items';
import { markItemActiveAction } from './items/mark-item-active';
import { markItemInactiveAction } from './items/mark-item-inactive';
import { updateItemAction } from './items/update-item';
import { getCurrentUserAction } from './organizations/get-current-user';
import { getOrganizationAction } from './organizations/get-organization';
import { getUserAction } from './organizations/get-user';
import { listOrganizationsAction } from './organizations/list-organizations';
import { listUsersAction } from './organizations/list-users';
import { updateUserAction } from './organizations/update-user';
import { activateProjectAction } from './projects/activate-project';
import { addProjectCommentAction } from './projects/add-project-comment';
import { cloneProjectAction } from './projects/clone-project';
import { createEmployeeAction } from './projects/create-employee';
import { createProjectAction } from './projects/create-project';
import { createTaskAction } from './projects/create-task';
import { createTimeEntryAction } from './projects/create-time-entry';
import { deactivateProjectAction } from './projects/deactivate-project';
import { deleteEmployeeAction } from './projects/delete-employee';
import { deleteProjectAction } from './projects/delete-project';
import { deleteProjectCommentAction } from './projects/delete-project-comment';
import { deleteTaskAction } from './projects/delete-task';
import { deleteTimeEntryAction } from './projects/delete-time-entry';
import { getProjectAction } from './projects/get-project';
import { getProjectUserAction } from './projects/get-project-user';
import { getRunningTimerAction } from './projects/get-running-timer';
import { getTaskAction } from './projects/get-task';
import { getTimeEntryAction } from './projects/get-time-entry';
import { listEmployeesAction } from './projects/list-employees';
import { listProjectCommentsAction } from './projects/list-project-comments';
import { listProjectInvoicesAction } from './projects/list-project-invoices';
import { listProjectUsersAction } from './projects/list-project-users';
import { listProjectsAction } from './projects/list-projects';
import { listTasksAction } from './projects/list-tasks';
import { listTimeEntriesAction } from './projects/list-time-entries';
import { startTimerAction } from './projects/start-timer';
import { stopTimerAction } from './projects/stop-timer';
import { updateProjectAction } from './projects/update-project';
import { updateProjectUserAction } from './projects/update-project-user';
import { updateTaskAction } from './projects/update-task';
import { updateTimeEntryAction } from './projects/update-time-entry';
import { createRecurringInvoiceAction } from './recurring-invoices/create-recurring-invoice';
import { deleteRecurringInvoiceAction } from './recurring-invoices/delete-recurring-invoice';
import { getRecurringInvoiceAction } from './recurring-invoices/get-recurring-invoice';
import { listRecurringInvoiceHistoryAction } from './recurring-invoices/list-recurring-invoice-history';
import { listRecurringInvoicesAction } from './recurring-invoices/list-recurring-invoices';
import { resumeRecurringInvoiceAction } from './recurring-invoices/resume-recurring-invoice';
import { stopRecurringInvoiceAction } from './recurring-invoices/stop-recurring-invoice';
import { updateRecurringInvoiceAction } from './recurring-invoices/update-recurring-invoice';
import { createCurrencyAction } from './settings/create-currency';
import { createExchangeRateAction } from './settings/create-exchange-rate';
import { createTaxAction } from './settings/create-tax';
import { createTaxGroupAction } from './settings/create-tax-group';
import { deleteCurrencyAction } from './settings/delete-currency';
import { deleteExchangeRateAction } from './settings/delete-exchange-rate';
import { deleteTaxAction } from './settings/delete-tax';
import { deleteTaxGroupAction } from './settings/delete-tax-group';
import { getCurrencyAction } from './settings/get-currency';
import { getExchangeRateAction } from './settings/get-exchange-rate';
import { getTaxAction } from './settings/get-tax';
import { getTaxGroupAction } from './settings/get-tax-group';
import { listCurrenciesAction } from './settings/list-currencies';
import { listExchangeRatesAction } from './settings/list-exchange-rates';
import { listTaxesAction } from './settings/list-taxes';
import { updateCurrencyAction } from './settings/update-currency';
import { updateExchangeRateAction } from './settings/update-exchange-rate';
import { updateTaxAction } from './settings/update-tax';
import { updateTaxGroupAction } from './settings/update-tax-group';

export const zohoInvoiceAiActions = [
	activateProjectAction,
	addContactAddressAction,
	addCreditNoteCommentAction,
	addEstimateCommentAction,
	addInvoiceAttachmentAction,
	addInvoiceCommentAction,
	addProjectCommentAction,
	applyCreditNoteToInvoicesAction,
	applyCreditsToInvoiceAction,
	cancelInvoiceWriteOffAction,
	cloneProjectAction,
	createContactPersonAction,
	createContactAction,
	createCreditNoteAction,
	createCurrencyAction,
	createCustomerPaymentAction,
	createEmployeeAction,
	createEstimateAction,
	createExchangeRateAction,
	createExpenseCategoryAction,
	createExpenseAction,
	createInvoiceAction,
	createItemAction,
	createProjectAction,
	createRecurringInvoiceAction,
	createTaskAction,
	createTaxGroupAction,
	createTaxAction,
	createTimeEntryAction,
	deactivateProjectAction,
	deleteContactAddressAction,
	deleteContactPersonAction,
	deleteContactAction,
	deleteCreditNoteCommentAction,
	deleteCreditNoteRefundAction,
	deleteCreditNoteAction,
	deleteCurrencyAction,
	deleteCustomerPaymentRefundAction,
	deleteCustomerPaymentAction,
	deleteEmployeeAction,
	deleteEstimateCommentAction,
	deleteEstimateAction,
	deleteExchangeRateAction,
	deleteExpenseCategoryAction,
	deleteExpenseAction,
	deleteInvoiceAttachmentAction,
	deleteInvoiceCommentAction,
	deleteInvoicePaymentAction,
	deleteInvoiceAction,
	deleteItemAction,
	deleteProjectCommentAction,
	deleteProjectAction,
	deleteRecurringInvoiceAction,
	deleteTaskAction,
	deleteTaxGroupAction,
	deleteTaxAction,
	deleteTimeEntryAction,
	disableContactPaymentRemindersAction,
	disableInvoicePaymentReminderAction,
	emailContactStatementAction,
	emailContactAction,
	emailCreditNoteAction,
	emailEstimateAction,
	emailInvoiceAction,
	emailMultipleEstimatesAction,
	enableContactPaymentRemindersAction,
	enableContactPortalAccessAction,
	enableInvoicePaymentReminderAction,
	exportEstimatesPdfAction,
	exportInvoicesPdfAction,
	getContactPersonAction,
	getContactStatementEmailContentAction,
	getContactAction,
	getCreditNoteEmailHistoryAction,
	getCreditNoteRefundAction,
	getCreditNoteAction,
	getCurrencyAction,
	getCurrentUserAction,
	getCustomerPaymentRefundAction,
	getCustomerPaymentAction,
	getEstimateEmailContentAction,
	getEstimateAction,
	getExchangeRateAction,
	getExpenseCategoryAction,
	getExpenseAction,
	getInvoiceAttachmentAction,
	getInvoiceEmailContentAction,
	getInvoicePaymentReminderContentAction,
	getInvoiceAction,
	getItemAction,
	getOrganizationAction,
	getProjectUserAction,
	getProjectAction,
	getRecurringInvoiceAction,
	getRunningTimerAction,
	getTaskAction,
	getTaxGroupAction,
	getTaxAction,
	getTimeEntryAction,
	getUserAction,
	listAllCreditNoteRefundsAction,
	listContactAddressesAction,
	listContactCommentsAction,
	listContactPersonsAction,
	listContactRefundsAction,
	listContactsAction,
	listCreditNoteCommentsAction,
	listCreditNoteInvoicesAction,
	listCreditNoteRefundsAction,
	listCreditNoteTemplatesAction,
	listCreditNotesAction,
	listCurrenciesAction,
	listCustomerPaymentRefundsAction,
	listCustomerPaymentsAction,
	listEmployeesAction,
	listEstimateCommentsAction,
	listEstimateTemplatesAction,
	listEstimatesAction,
	listExchangeRatesAction,
	listExpenseCategoriesAction,
	listExpenseHistoryAction,
	listExpensesAction,
	listInvoiceCommentsAction,
	listInvoiceCreditsAppliedAction,
	listInvoicePaymentsAction,
	listInvoiceTemplatesAction,
	listInvoicesAction,
	listItemsAction,
	listOrganizationsAction,
	listProjectCommentsAction,
	listProjectInvoicesAction,
	listProjectUsersAction,
	listProjectsAction,
	listRecurringInvoiceHistoryAction,
	listRecurringInvoicesAction,
	listTasksAction,
	listTaxesAction,
	listTimeEntriesAction,
	listUsersAction,
	markContactActiveAction,
	markContactInactiveAction,
	markContactPersonPrimaryAction,
	markEstimateAcceptedAction,
	markEstimateDeclinedAction,
	markEstimateSentAction,
	markExpenseCategoryActiveAction,
	markExpenseCategoryInactiveAction,
	markInvoiceDraftAction,
	markInvoiceSentAction,
	markItemActiveAction,
	markItemInactiveAction,
	refundCreditNoteAction,
	refundCustomerPaymentAction,
	removeCreditNoteFromInvoiceAction,
	reopenCreditNoteAction,
	resumeRecurringInvoiceAction,
	sendBulkInvoiceReminderAction,
	sendInvoicePaymentReminderAction,
	setCreditNoteTemplateAction,
	setEstimateTemplateAction,
	setInvoiceTemplateAction,
	startTimerAction,
	stopRecurringInvoiceAction,
	stopTimerAction,
	updateContactAddressAction,
	updateContactPersonAction,
	updateContactAction,
	updateCreditNoteRefundAction,
	updateCreditNoteAction,
	updateCurrencyAction,
	updateCustomerPaymentCustomFieldsAction,
	updateCustomerPaymentRefundAction,
	updateCustomerPaymentAction,
	updateEstimateBillingAddressAction,
	updateEstimateCommentAction,
	updateEstimateShippingAddressAction,
	updateEstimateAction,
	updateExchangeRateAction,
	updateExpenseCategoryAction,
	updateExpenseAction,
	updateInvoiceBillingAddressAction,
	updateInvoiceCommentAction,
	updateInvoiceShippingAddressAction,
	updateInvoiceAction,
	updateItemAction,
	updateProjectUserAction,
	updateProjectAction,
	updateRecurringInvoiceAction,
	updateTaskAction,
	updateTaxGroupAction,
	updateTaxAction,
	updateTimeEntryAction,
	updateUserAction,
	voidCreditNoteAction,
	voidInvoiceAction,
	writeOffInvoiceAction,
];
