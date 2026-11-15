import { contactsApi } from './contacts';
import { creditNotesApi } from './credit-notes';
import { customerPaymentsApi } from './customer-payments';
import { estimatesApi } from './estimates';
import { expensesApi } from './expenses';
import { invoicesApi } from './invoices';
import { itemsApi } from './items';
import { organizationsApi } from './organizations';
import { projectsApi } from './projects';
import { recurringInvoicesApi } from './recurring-invoices';
import { settingsApi } from './settings';

export const zohoInvoiceApi = {
	...organizationsApi,
	...contactsApi,
	...invoicesApi,
	...recurringInvoicesApi,
	...estimatesApi,
	...creditNotesApi,
	...customerPaymentsApi,
	...itemsApi,
	...expensesApi,
	...projectsApi,
	...settingsApi,
};
