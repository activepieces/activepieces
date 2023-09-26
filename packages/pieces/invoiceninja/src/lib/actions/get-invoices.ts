// action to return invoices from InvoiceNinja with filtering by invoice status and client id
import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { invoiceninjaAuth } from "../..";
export const getInvoices = createAction({
    auth: invoiceninjaAuth,
        name: 'getinvoices_task',
        displayName: 'Get Invoices',
        description: 'Gets data for invoices.',

        props: {
            invoiceStatus: Property.StaticDropdown({
                displayName: 'Invoice Status',
                description: 'Select the invoice status for filtering.',
                required: true,
                options: {
                    options: [
                        {
                            label: 'Unpaid Invoices',
                            value: 'unpaid'
                        },
                        {
                            label: 'Paid Invoices',
                            value: 'paid'
                        },
                        {
                            label: 'Overdue Invoices',
                            value: 'overdue'
                        },
                        {
                            label: 'All Invoices',
                            value: 'all'
                        },
                    ]
                }
            }),
            clientID: Property.LongText({
                displayName: 'Client ID',
                description: 'Filter by Client ID, default is all clients.',
                required: false,
            }),
        },

        async run(context) {
            const INapiToken = context.auth.access_token;

            const headers = {
                'X-Api-Token': INapiToken,
            };

            const queryParams = new URLSearchParams();
            queryParams.append('client_status', context.propsValue.invoiceStatus || 'unpaid');
            queryParams.append('client_id', context.propsValue.clientID || '');
            queryParams.append('is_deleted', 'false'); // only return invoices that are not deleted

            // Remove trailing slash from base_url
            const baseUrl = context.auth.base_url.replace(/\/$/, "");
            const url = `${baseUrl}/api/v1/invoices/?${queryParams.toString()}`;
            const httprequestdata = {
                method: HttpMethod.GET,
                url,
                headers,
            };
            
            try {
                  const response = await httpClient.sendRequest(httprequestdata);
                  // Process the successful response here (status 2xx).
                  //
                  if (response.body.meta.pagination.total>0) { 
                    // Each invoice that is found will have lots of information, lets remove the guff
                    const NumberOfInvoices=response.body.data[0].contacts.length;
                    for(let i=0; i < NumberOfInvoices; i++) {
                    // theres a lot of extra data I don't really want in the actual response of contacts so I want to tr and just pick out
                    // firstname, lastname, email, etc as I don't think we need the rest, just to keep it simpler
                    delete response.body.data[i].id;
                    delete response.body.data[i].user_id;
                    delete response.body.data[i].assigned_user_id;
                    delete response.body.data[i].vendor_id;
                    delete response.body.data[i].design_id;
                    delete response.body.data[i].created_at;
                    delete response.body.data[i].updated_at;
                    delete response.body.data[i].is_deleted;                    
                    }
                   /* const json=[{
                        client_no_contacts: NumberOfInvoices,
                        client_id: response.body.data[0].id,
                        client_name: response.body.data[0].name,
                        client_web: response.body.data[0].website,
                        client_private_notes: response.body.data[0].private_notes,
                        client_balance: response.body.data[0].balance,
                        client_paid_to_date: response.body.data[0].paid_to_date,
                        client_payment_balance: response.body.data[0].payment_balance,
                        client_credit_balance: response.body.data[0].credit_balance,
                        client_public_notes: response.body.data[0].public_notes,
                        client_address1: response.body.data[0].address1,
                        client_address2: response.body.data[0].address2,
                        client_phone: response.body.data[0].phone,
                        client_city: response.body.data[0].city,
                        client_state: response.body.data[0].state,
                        client_postcode: response.body.data[0].postal_code,
                        client_vat: response.body.data[0].vat_number,
                        client_display_name: response.body.data[0].display_name,
                        client_contacts: response.body.data[0].contacts,
                        //meta: response.body.meta,
                        }]
                        //return json;
                        */
                        return response.body;
                    return true; 
                } else { 
                    return false; 
                } // this is still returned so if it is false we'll return notfound or similar
                } catch (error) {
                  // Handle the error when the request fails (status other than 2xx).
                  return "There was a problem getting information from your Invoice Ninja";
                }

            }             
})
