import createContact from './create-contact';
import createCompany from './create-company';
import getContacts from './get-contacts';
import getRecords from './get-records';
import createRecord from './create-record';
import updateRecord from './update-record';
import customOdooApiCall from './custom-api-call';

export default [
    getContacts,
    createContact,
    createCompany,
    getRecords,
    createRecord,
    updateRecord,
    customOdooApiCall,
];
