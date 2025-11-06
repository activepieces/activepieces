import { Property } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const contactIdDropdown = Property.Dropdown({
    displayName: 'Contact',
    description: 'Select the contact to unsubscribe',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your account first',
            };
        }

        try {
            const Contacts = await makeRequest(auth as string, HttpMethod.GET, '/Contacts?fields=id,firstName,lastName,email,cellphone');
            return {
                disabled: false,
                options: Contacts.map((Contact: any) => {
                    const name = `${Contact.firstName || ''} ${Contact.lastName || ''}`.trim();
                    const email = Contact.email ? ` (${Contact.email})` : '';
                    const phone = !Contact.email && Contact.cellphone ? ` (${Contact.cellphone})` : '';
                    
                    const label = name 
                        ? `${name}${email || phone}` 
                        : Contact.email 
                            ? Contact.email 
                            : Contact.cellphone 
                                ? Contact.cellphone 
                                : `Contact ${Contact.id}`;
                    
                    return {
                        label,
                        value: Contact.id,
                    };
                }),
                placeholder: 'Select a contact to unsubscribe'
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Error loading contacts',
            };
        }
    },
});

export const emailDropdown = Property.Dropdown({
    displayName: 'Email Address',
    description: 'Select an existing contact email or type a new one',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your account first',
            };
        }

        try {
            const Contacts = await makeRequest(auth as string, HttpMethod.GET, '/Contacts?fields=id,firstName,lastName,email');
            const emailOptions = Contacts
                .filter((Contact: any) => Contact.email) // Only contacts with emails
                .map((Contact: any) => {
                    const name = `${Contact.firstName || ''} ${Contact.lastName || ''}`.trim();
                    const label = name ? `${Contact.email} (${name})` : Contact.email;
                    
                    return {
                        label,
                        value: Contact.email,
                    };
                });

            return {
                disabled: false,
                options: emailOptions,
                placeholder: 'Select existing email or type new one'
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Type email address manually',
            };
        }
    },
});

export const listsDropdown = Property.MultiSelectDropdown({
    displayName: 'Lists',
    description: 'Select lists to subscribe the contact to',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your account first',
            };
        }

        try {
            const Lists = await makeRequest(auth as string, HttpMethod.GET, '/Lists');
            return {
                disabled: false,
                options: Lists.map((List: any) => ({
                    label: List.name || `List ${List.id}`,
                    value: List.id,
                })),
                placeholder: 'Select lists (optional)'
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Error loading lists',
            };
        }
    },
});

export const LandingPageIdDropdown = Property.Dropdown({
    displayName: 'LandingPage/Form ID',
    description: 'Select the andingPage/Form  ',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your account first',
            };
        }

        try {
            const LandingPages = await makeRequest(auth as string, HttpMethod.GET, '/LandingPages');
            return {
                disabled: false,
                options: LandingPages.map((LandingPage: any) => ({
                    label: LandingPage.formTitle,
                    value: LandingPage.formId
                })),
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Error loading teams',
            };
        }
    },
})