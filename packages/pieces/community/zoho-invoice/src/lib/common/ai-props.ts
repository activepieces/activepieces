import { Property } from '@activepieces/pieces-framework';

function idProp<R extends boolean>({
	required,
	displayName,
	description,
}: PropParams<R> & { displayName: string }) {
	return Property.ShortText({ displayName, description, required });
}

function organizationId<R extends boolean>({
	required,
	displayName = 'Organization ID',
	description = 'Zoho Invoice organization ID. Use List Organizations to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function page<R extends boolean>({
	required,
	displayName = 'Page',
	description = 'Page number to fetch, starting at 1. Defaults to 1. Use page_context.has_more_page in the response to know if there is a next page.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function perPage<R extends boolean>({
	required,
	displayName = 'Per Page',
	description = 'Records per page (1-200). Defaults to 200.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function additionalFields<R extends boolean>({
	required,
	displayName = 'Additional Fields',
	description = 'Other fields to send as-is, as a JSON object using the Zoho Invoice API field names. The dedicated inputs above override keys set here.',
}: PropParams<R>) {
	return Property.Json({ displayName, description, required });
}

function searchText<R extends boolean>({
	required,
	displayName = 'Search Text',
	description = 'Free-text search across the main fields.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function sortColumn<R extends boolean>({
	required,
	displayName = 'Sort Column',
	description = 'Field to sort by.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function sortOrder<R extends boolean>({
	required,
	displayName = 'Sort Order',
	description = 'Ascending (A) or descending (D). Empty = the vendor default.',
}: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: [
				{ label: 'Ascending', value: 'A' },
				{ label: 'Descending', value: 'D' },
			],
		},
	});
}

function yesNo<R extends boolean>({
	required,
	displayName,
	description,
}: PropParams<R> & { displayName: string }) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: [
				{ label: 'Yes', value: 'true' },
				{ label: 'No', value: 'false' },
			],
		},
	});
}

function userId<R extends boolean>({
	required,
	displayName = 'User ID',
	description = 'User ID. Use List Users to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function contactId<R extends boolean>({
	required,
	displayName = 'Contact ID',
	description = 'Contact (customer) ID. Use List Contacts to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function contactPersonId<R extends boolean>({
	required,
	displayName = 'Contact Person ID',
	description = 'Contact person ID. Use List Contact Persons to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function invoiceId<R extends boolean>({
	required,
	displayName = 'Invoice ID',
	description = 'Invoice ID. Use List Invoices to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function recurringInvoiceId<R extends boolean>({
	required,
	displayName = 'Recurring Invoice ID',
	description = 'Recurring invoice ID. Use List Recurring Invoices to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function estimateId<R extends boolean>({
	required,
	displayName = 'Estimate ID',
	description = 'Estimate ID. Use List Estimates to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function creditNoteId<R extends boolean>({
	required,
	displayName = 'Credit Note ID',
	description = 'Credit note ID. Use List Credit Notes to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function paymentId<R extends boolean>({
	required,
	displayName = 'Payment ID',
	description = 'Customer payment ID. Use List Customer Payments to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function itemId<R extends boolean>({
	required,
	displayName = 'Item ID',
	description = 'Item ID. Use List Items to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function expenseId<R extends boolean>({
	required,
	displayName = 'Expense ID',
	description = 'Expense ID. Use List Expenses to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function expenseCategoryId<R extends boolean>({
	required,
	displayName = 'Expense Category ID',
	description = 'Expense category ID. Use List Expense Categories to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function projectId<R extends boolean>({
	required,
	displayName = 'Project ID',
	description = 'Project ID. Use List Projects to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function taskId<R extends boolean>({
	required,
	displayName = 'Task ID',
	description = 'Project task ID. Use List Tasks to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function timeEntryId<R extends boolean>({
	required,
	displayName = 'Time Entry ID',
	description = 'Time entry ID. Use List Time Entries to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function currencyId<R extends boolean>({
	required,
	displayName = 'Currency ID',
	description = 'Currency ID. Use List Currencies to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function taxId<R extends boolean>({
	required,
	displayName = 'Tax ID',
	description = 'Tax ID. Use List Taxes to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function templateId<R extends boolean>({
	required,
	displayName = 'Template ID',
	description = 'PDF template ID.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function commentId<R extends boolean>({
	required,
	displayName = 'Comment ID',
	description = 'Comment ID.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

export const zohoInvoiceAiProps = {
	idProp,
	organizationId,
	page,
	perPage,
	additionalFields,
	searchText,
	sortColumn,
	sortOrder,
	yesNo,
	userId,
	contactId,
	contactPersonId,
	invoiceId,
	recurringInvoiceId,
	estimateId,
	creditNoteId,
	paymentId,
	itemId,
	expenseId,
	expenseCategoryId,
	projectId,
	taskId,
	timeEntryId,
	currencyId,
	taxId,
	templateId,
	commentId,
};

export type PropParams<R extends boolean> = {
	required: R;
	displayName?: string;
	description?: string;
};
