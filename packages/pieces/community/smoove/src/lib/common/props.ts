import { Property } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const contactIdDropdown = Property.Dropdown({
    displayName: 'Contact ID',
    description: 'Select the Contact',
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
            const Contacts = await makeRequest(auth as string, HttpMethod.GET, '/Contacts');
            return {
                disabled: false,
                options: Contacts.map((Contact: any) => ({
                    label: Contact.firstName + Contact.lastName,
                    value: Contact.id,
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