import createContact from './create-contact';
import createCompany from './create-company';
import getContacts from './get-contacts';
import getRecords from './get-records';
import createRecord from './create-record';
import updateRecord from './update-record';
import customOdooApiCall from './custom-api-call';
import { getRecordAction } from './get-record';
import { deleteRecordAction } from './delete-record';
import { runRecordActionAction } from './run-record-action';
import { postChatterMessageAction } from './post-chatter-message';
import { attachFileAction } from './attach-file';
import { createLeadAction } from './create-lead';
import { createSalesOrderAction } from './create-sales-order';
import { findInvoicesAction } from './find-invoices';

export default [
    getContacts,
    createContact,
    createCompany,
    getRecords,
    createRecord,
    updateRecord,
    customOdooApiCall,
    getRecordAction,
    deleteRecordAction,
    runRecordActionAction,
    postChatterMessageAction,
    attachFileAction,
    createLeadAction,
    createSalesOrderAction,
    findInvoicesAction,
];
