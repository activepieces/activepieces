import { createAttachableNoteAction } from './attachments/create-attachable-note';
import { deleteAttachableAction } from './attachments/delete-attachable';
import { getAttachableDownloadUrlAction } from './attachments/get-attachable-download-url';
import { getAttachableAction } from './attachments/get-attachable';
import { listAttachablesAction } from './attachments/list-attachables';
import { updateAttachableAction } from './attachments/update-attachable';
import { uploadAttachableAction } from './attachments/upload-attachable';
import { createDepositAction } from './banking/create-deposit';
import { createJournalEntryAction } from './banking/create-journal-entry';
import { createTransferAction } from './banking/create-transfer';
import { deleteDepositAction } from './banking/delete-deposit';
import { deleteJournalEntryAction } from './banking/delete-journal-entry';
import { deleteTransferAction } from './banking/delete-transfer';
import { getDepositAction } from './banking/get-deposit';
import { getJournalEntryAction } from './banking/get-journal-entry';
import { getTransferAction } from './banking/get-transfer';
import { listDepositsAction } from './banking/list-deposits';
import { listJournalEntriesAction } from './banking/list-journal-entries';
import { listTransfersAction } from './banking/list-transfers';
import { updateDepositAction } from './banking/update-deposit';
import { updateJournalEntryAction } from './banking/update-journal-entry';
import { updateTransferAction } from './banking/update-transfer';
import { getCompanyInfoAction } from './company/get-company-info';
import { getExchangeRateAction } from './company/get-exchange-rate';
import { getPreferencesAction } from './company/get-preferences';
import { listExchangeRatesAction } from './company/list-exchange-rates';
import { createBillPaymentAiAction } from './expenses/create-bill-payment';
import { createBillAiAction } from './expenses/create-bill';
import { createCreditCardPaymentAction } from './expenses/create-credit-card-payment';
import { createPurchaseOrderAction } from './expenses/create-purchase-order';
import { createPurchaseAiAction } from './expenses/create-purchase';
import { createVendorCreditAction } from './expenses/create-vendor-credit';
import { deleteBillPaymentAction } from './expenses/delete-bill-payment';
import { deleteBillAction } from './expenses/delete-bill';
import { deleteCreditCardPaymentAction } from './expenses/delete-credit-card-payment';
import { deletePurchaseOrderAction } from './expenses/delete-purchase-order';
import { deletePurchaseAction } from './expenses/delete-purchase';
import { deleteVendorCreditAction } from './expenses/delete-vendor-credit';
import { getBillPaymentAction } from './expenses/get-bill-payment';
import { getBillAction } from './expenses/get-bill';
import { getCreditCardPaymentAction } from './expenses/get-credit-card-payment';
import { getPurchaseOrderPdfAction } from './expenses/get-purchase-order-pdf';
import { getPurchaseOrderAction } from './expenses/get-purchase-order';
import { getPurchaseAction } from './expenses/get-purchase';
import { getVendorCreditAction } from './expenses/get-vendor-credit';
import { listBillPaymentsAction } from './expenses/list-bill-payments';
import { listBillsAction } from './expenses/list-bills';
import { listCreditCardPaymentsAction } from './expenses/list-credit-card-payments';
import { listPurchaseOrdersAction } from './expenses/list-purchase-orders';
import { listPurchasesAction } from './expenses/list-purchases';
import { listVendorCreditsAction } from './expenses/list-vendor-credits';
import { sendPurchaseOrderAction } from './expenses/send-purchase-order';
import { updateBillPaymentAction } from './expenses/update-bill-payment';
import { updateBillAction } from './expenses/update-bill';
import { updateCreditCardPaymentAction } from './expenses/update-credit-card-payment';
import { updatePurchaseOrderAction } from './expenses/update-purchase-order';
import { updatePurchaseAction } from './expenses/update-purchase';
import { updateVendorCreditAction } from './expenses/update-vendor-credit';
import { voidBillPaymentAction } from './expenses/void-bill-payment';
import { createAccountAction } from './lists/create-account';
import { createBudgetAction } from './lists/create-budget';
import { createClassAction } from './lists/create-class';
import { createDepartmentAction } from './lists/create-department';
import { createPaymentMethodAction } from './lists/create-payment-method';
import { createRecurringTransactionAction } from './lists/create-recurring-transaction';
import { createTermAction } from './lists/create-term';
import { deleteBudgetAction } from './lists/delete-budget';
import { deleteRecurringTransactionAction } from './lists/delete-recurring-transaction';
import { getAccountAction } from './lists/get-account';
import { getBudgetAction } from './lists/get-budget';
import { getClassAction } from './lists/get-class';
import { getDepartmentAction } from './lists/get-department';
import { getPaymentMethodAction } from './lists/get-payment-method';
import { getRecurringTransactionAction } from './lists/get-recurring-transaction';
import { getTermAction } from './lists/get-term';
import { listAccountsAiAction } from './lists/list-accounts';
import { listBudgetsAction } from './lists/list-budgets';
import { listClassesAction } from './lists/list-classes';
import { listDepartmentsAction } from './lists/list-departments';
import { listPaymentMethodsAction } from './lists/list-payment-methods';
import { listRecurringTransactionsAction } from './lists/list-recurring-transactions';
import { listTermsAction } from './lists/list-terms';
import { updateAccountAction } from './lists/update-account';
import { updateBudgetAction } from './lists/update-budget';
import { updateClassAction } from './lists/update-class';
import { updateDepartmentAction } from './lists/update-department';
import { updatePaymentMethodAction } from './lists/update-payment-method';
import { updateTermAction } from './lists/update-term';
import { createCustomerAction } from './people/create-customer';
import { createEmployeeAction } from './people/create-employee';
import { createTimeActivityAction } from './people/create-time-activity';
import { createVendorAiAction } from './people/create-vendor';
import { deleteTimeActivityAction } from './people/delete-time-activity';
import { getCustomerTypeAction } from './people/get-customer-type';
import { getCustomerAction } from './people/get-customer';
import { getEmployeeAction } from './people/get-employee';
import { getTimeActivityAction } from './people/get-time-activity';
import { getVendorAction } from './people/get-vendor';
import { listCustomerTypesAction } from './people/list-customer-types';
import { listCustomersAiAction } from './people/list-customers';
import { listEmployeesAction } from './people/list-employees';
import { listTimeActivitiesAction } from './people/list-time-activities';
import { listVendorsAiAction } from './people/list-vendors';
import { updateCustomerAction } from './people/update-customer';
import { updateEmployeeAction } from './people/update-employee';
import { updateTimeActivityAction } from './people/update-time-activity';
import { updateVendorAction } from './people/update-vendor';
import { listChangedEntitiesAction } from './platform/list-changed-entities';
import { runBatchAction } from './platform/run-batch';
import { runQueryAction } from './platform/run-query';
import { createInventoryAdjustmentAction } from './products/create-inventory-adjustment';
import { createItemAction } from './products/create-item';
import { deleteInventoryAdjustmentAction } from './products/delete-inventory-adjustment';
import { getInventoryAdjustmentAction } from './products/get-inventory-adjustment';
import { getItemAction } from './products/get-item';
import { listItemsAction } from './products/list-items';
import { updateInventoryAdjustmentAction } from './products/update-inventory-adjustment';
import { updateItemAction } from './products/update-item';
import { getReimburseChargeAction } from './projects/get-reimburse-charge';
import { listReimburseChargesAction } from './projects/list-reimburse-charges';
import { getAccountListReportAction } from './reports/get-account-list-report';
import { getAgedPayableDetailReportAction } from './reports/get-aged-payable-detail-report';
import { getAgedPayablesReportAction } from './reports/get-aged-payables-report';
import { getAgedReceivableDetailReportAction } from './reports/get-aged-receivable-detail-report';
import { getAgedReceivablesReportAiAction } from './reports/get-aged-receivables-report';
import { getBalanceSheetReportAction } from './reports/get-balance-sheet-report';
import { getCashFlowReportAction } from './reports/get-cash-flow-report';
import { getClassSalesReportAction } from './reports/get-class-sales-report';
import { getCustomerBalanceDetailReportAction } from './reports/get-customer-balance-detail-report';
import { getCustomerBalanceReportAction } from './reports/get-customer-balance-report';
import { getCustomerIncomeReportAction } from './reports/get-customer-income-report';
import { getCustomerSalesReportAction } from './reports/get-customer-sales-report';
import { getDepartmentSalesReportAction } from './reports/get-department-sales-report';
import { getGeneralLedgerReportAction } from './reports/get-general-ledger-report';
import { getInventoryValuationDetailReportAction } from './reports/get-inventory-valuation-detail-report';
import { getInventoryValuationSummaryReportAction } from './reports/get-inventory-valuation-summary-report';
import { getItemSalesReportAction } from './reports/get-item-sales-report';
import { getJournalReportAction } from './reports/get-journal-report';
import { getProfitAndLossDetailReportAction } from './reports/get-profit-and-loss-detail-report';
import { getProfitAndLossReportAction } from './reports/get-profit-and-loss-report';
import { getTransactionListByCustomerReportAction } from './reports/get-transaction-list-by-customer-report';
import { getTransactionListByVendorReportAction } from './reports/get-transaction-list-by-vendor-report';
import { getTransactionListReportAction } from './reports/get-transaction-list-report';
import { getTransactionListWithSplitsReportAction } from './reports/get-transaction-list-with-splits-report';
import { getTrialBalanceReportAction } from './reports/get-trial-balance-report';
import { getVendorBalanceDetailReportAction } from './reports/get-vendor-balance-detail-report';
import { getVendorBalanceReportAction } from './reports/get-vendor-balance-report';
import { getVendorExpensesReportAction } from './reports/get-vendor-expenses-report';
import { createCreditMemoAction } from './sales/create-credit-memo';
import { createEstimateAction } from './sales/create-estimate';
import { createInvoiceAiAction } from './sales/create-invoice';
import { createPaymentAiAction } from './sales/create-payment';
import { createRefundReceiptAction } from './sales/create-refund-receipt';
import { createSalesReceiptAction } from './sales/create-sales-receipt';
import { deleteCreditMemoAction } from './sales/delete-credit-memo';
import { deleteEstimateAction } from './sales/delete-estimate';
import { deleteInvoiceAction } from './sales/delete-invoice';
import { deletePaymentAction } from './sales/delete-payment';
import { deleteRefundReceiptAction } from './sales/delete-refund-receipt';
import { deleteSalesReceiptAction } from './sales/delete-sales-receipt';
import { getCreditMemoPdfAction } from './sales/get-credit-memo-pdf';
import { getCreditMemoAction } from './sales/get-credit-memo';
import { getEstimatePdfAction } from './sales/get-estimate-pdf';
import { getEstimateAction } from './sales/get-estimate';
import { getInvoicePdfAction } from './sales/get-invoice-pdf';
import { getInvoiceAction } from './sales/get-invoice';
import { getPaymentPdfAction } from './sales/get-payment-pdf';
import { getPaymentAction } from './sales/get-payment';
import { getRefundReceiptPdfAction } from './sales/get-refund-receipt-pdf';
import { getRefundReceiptAction } from './sales/get-refund-receipt';
import { getSalesReceiptPdfAction } from './sales/get-sales-receipt-pdf';
import { getSalesReceiptAction } from './sales/get-sales-receipt';
import { listCreditMemosAction } from './sales/list-credit-memos';
import { listEstimatesAction } from './sales/list-estimates';
import { listInvoicesAiAction } from './sales/list-invoices';
import { listPaymentsAiAction } from './sales/list-payments';
import { listRefundReceiptsAction } from './sales/list-refund-receipts';
import { listSalesReceiptsAction } from './sales/list-sales-receipts';
import { sendCreditMemoAction } from './sales/send-credit-memo';
import { sendEstimateAction } from './sales/send-estimate';
import { sendInvoiceAction } from './sales/send-invoice';
import { sendPaymentAction } from './sales/send-payment';
import { sendRefundReceiptAction } from './sales/send-refund-receipt';
import { sendSalesReceiptAction } from './sales/send-sales-receipt';
import { updateCreditMemoAction } from './sales/update-credit-memo';
import { updateEstimateAction } from './sales/update-estimate';
import { updateInvoiceAction } from './sales/update-invoice';
import { updatePaymentAction } from './sales/update-payment';
import { updateRefundReceiptAction } from './sales/update-refund-receipt';
import { updateSalesReceiptAction } from './sales/update-sales-receipt';
import { voidInvoiceAction } from './sales/void-invoice';
import { voidPaymentAction } from './sales/void-payment';
import { voidSalesReceiptAction } from './sales/void-sales-receipt';
import { createTaxAgencyAction } from './tax/create-tax-agency';
import { createTaxCodeAction } from './tax/create-tax-code';
import { getTaxAgencyAction } from './tax/get-tax-agency';
import { getTaxCodeAction } from './tax/get-tax-code';
import { getTaxRateAction } from './tax/get-tax-rate';
import { listTaxAgenciesAction } from './tax/list-tax-agencies';
import { listTaxCodesAction } from './tax/list-tax-codes';
import { listTaxRatesAction } from './tax/list-tax-rates';

export const quickbooksSandboxAiActions = [
	createAttachableNoteAction,
	deleteAttachableAction,
	getAttachableDownloadUrlAction,
	getAttachableAction,
	listAttachablesAction,
	updateAttachableAction,
	uploadAttachableAction,
	createDepositAction,
	createJournalEntryAction,
	createTransferAction,
	deleteDepositAction,
	deleteJournalEntryAction,
	deleteTransferAction,
	getDepositAction,
	getJournalEntryAction,
	getTransferAction,
	listDepositsAction,
	listJournalEntriesAction,
	listTransfersAction,
	updateDepositAction,
	updateJournalEntryAction,
	updateTransferAction,
	getCompanyInfoAction,
	getExchangeRateAction,
	getPreferencesAction,
	listExchangeRatesAction,
	createBillPaymentAiAction,
	createBillAiAction,
	createCreditCardPaymentAction,
	createPurchaseOrderAction,
	createPurchaseAiAction,
	createVendorCreditAction,
	deleteBillPaymentAction,
	deleteBillAction,
	deleteCreditCardPaymentAction,
	deletePurchaseOrderAction,
	deletePurchaseAction,
	deleteVendorCreditAction,
	getBillPaymentAction,
	getBillAction,
	getCreditCardPaymentAction,
	getPurchaseOrderPdfAction,
	getPurchaseOrderAction,
	getPurchaseAction,
	getVendorCreditAction,
	listBillPaymentsAction,
	listBillsAction,
	listCreditCardPaymentsAction,
	listPurchaseOrdersAction,
	listPurchasesAction,
	listVendorCreditsAction,
	sendPurchaseOrderAction,
	updateBillPaymentAction,
	updateBillAction,
	updateCreditCardPaymentAction,
	updatePurchaseOrderAction,
	updatePurchaseAction,
	updateVendorCreditAction,
	voidBillPaymentAction,
	createAccountAction,
	createBudgetAction,
	createClassAction,
	createDepartmentAction,
	createPaymentMethodAction,
	createRecurringTransactionAction,
	createTermAction,
	deleteBudgetAction,
	deleteRecurringTransactionAction,
	getAccountAction,
	getBudgetAction,
	getClassAction,
	getDepartmentAction,
	getPaymentMethodAction,
	getRecurringTransactionAction,
	getTermAction,
	listAccountsAiAction,
	listBudgetsAction,
	listClassesAction,
	listDepartmentsAction,
	listPaymentMethodsAction,
	listRecurringTransactionsAction,
	listTermsAction,
	updateAccountAction,
	updateBudgetAction,
	updateClassAction,
	updateDepartmentAction,
	updatePaymentMethodAction,
	updateTermAction,
	createCustomerAction,
	createEmployeeAction,
	createTimeActivityAction,
	createVendorAiAction,
	deleteTimeActivityAction,
	getCustomerTypeAction,
	getCustomerAction,
	getEmployeeAction,
	getTimeActivityAction,
	getVendorAction,
	listCustomerTypesAction,
	listCustomersAiAction,
	listEmployeesAction,
	listTimeActivitiesAction,
	listVendorsAiAction,
	updateCustomerAction,
	updateEmployeeAction,
	updateTimeActivityAction,
	updateVendorAction,
	listChangedEntitiesAction,
	runBatchAction,
	runQueryAction,
	createInventoryAdjustmentAction,
	createItemAction,
	deleteInventoryAdjustmentAction,
	getInventoryAdjustmentAction,
	getItemAction,
	listItemsAction,
	updateInventoryAdjustmentAction,
	updateItemAction,
	getReimburseChargeAction,
	listReimburseChargesAction,
	getAccountListReportAction,
	getAgedPayableDetailReportAction,
	getAgedPayablesReportAction,
	getAgedReceivableDetailReportAction,
	getAgedReceivablesReportAiAction,
	getBalanceSheetReportAction,
	getCashFlowReportAction,
	getClassSalesReportAction,
	getCustomerBalanceDetailReportAction,
	getCustomerBalanceReportAction,
	getCustomerIncomeReportAction,
	getCustomerSalesReportAction,
	getDepartmentSalesReportAction,
	getGeneralLedgerReportAction,
	getInventoryValuationDetailReportAction,
	getInventoryValuationSummaryReportAction,
	getItemSalesReportAction,
	getJournalReportAction,
	getProfitAndLossDetailReportAction,
	getProfitAndLossReportAction,
	getTransactionListByCustomerReportAction,
	getTransactionListByVendorReportAction,
	getTransactionListReportAction,
	getTransactionListWithSplitsReportAction,
	getTrialBalanceReportAction,
	getVendorBalanceDetailReportAction,
	getVendorBalanceReportAction,
	getVendorExpensesReportAction,
	createCreditMemoAction,
	createEstimateAction,
	createInvoiceAiAction,
	createPaymentAiAction,
	createRefundReceiptAction,
	createSalesReceiptAction,
	deleteCreditMemoAction,
	deleteEstimateAction,
	deleteInvoiceAction,
	deletePaymentAction,
	deleteRefundReceiptAction,
	deleteSalesReceiptAction,
	getCreditMemoPdfAction,
	getCreditMemoAction,
	getEstimatePdfAction,
	getEstimateAction,
	getInvoicePdfAction,
	getInvoiceAction,
	getPaymentPdfAction,
	getPaymentAction,
	getRefundReceiptPdfAction,
	getRefundReceiptAction,
	getSalesReceiptPdfAction,
	getSalesReceiptAction,
	listCreditMemosAction,
	listEstimatesAction,
	listInvoicesAiAction,
	listPaymentsAiAction,
	listRefundReceiptsAction,
	listSalesReceiptsAction,
	sendCreditMemoAction,
	sendEstimateAction,
	sendInvoiceAction,
	sendPaymentAction,
	sendRefundReceiptAction,
	sendSalesReceiptAction,
	updateCreditMemoAction,
	updateEstimateAction,
	updateInvoiceAction,
	updatePaymentAction,
	updateRefundReceiptAction,
	updateSalesReceiptAction,
	voidInvoiceAction,
	voidPaymentAction,
	voidSalesReceiptAction,
	createTaxAgencyAction,
	createTaxCodeAction,
	getTaxAgencyAction,
	getTaxCodeAction,
	getTaxRateAction,
	listTaxAgenciesAction,
	listTaxCodesAction,
	listTaxRatesAction,
];
