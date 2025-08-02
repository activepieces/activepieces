import { HttpMethod } from "@activepieces/pieces-common";
import { Property } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";

export const mailboxIdDropdown = Property.Dropdown({
    displayName: 'Mailboxes Id',
    description: 'Mail',
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
            const response = await makeRequest(auth as string, HttpMethod.GET, '/mailboxes');
            const mailboxes = response._embedded?.mailboxes ?? [];
            return {
                disabled: false,
                options: mailboxes.map((mailbox: any) => ({
                    label: mailbox.name,
                    value: mailbox.id,
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


export const conversationIdDropdown = Property.Dropdown({
    displayName: 'conversation Id',
    description: 'conversation Id from the mailboxe',
    required: true,
    refreshers: ['auth', 'mailboxId'],
    options: async ({ auth, mailboxId }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your account first',
            };
        }
        if (!mailboxId) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please select mailbox',
            };
        }

        try {
            const response = await makeRequest(auth as string, HttpMethod.GET, `/conversations?mailboxid=${mailboxId}`);
            const conversations = response._embedded?.conversations ?? [];
            return {
                disabled: false,
                options: conversations.map((conversation: any) => ({
                    label: conversation.name,
                    value: conversation.id,
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


export const customerIdDropdown = Property.Dropdown({
    displayName: 'Customer Id',
    description: 'customer Id ',
    required: true,
    refreshers: ['auth',],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your account first',
            };
        }

        try {
            const response = await makeRequest(auth as string, HttpMethod.GET, `/customers `);
            const customers = response._embedded?.customers ?? [];
            return {
                disabled: false,
                options: customers.map((customer: any) => ({
                    label: customer.firstName + customer.lastName,
                    value: customer.id,
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