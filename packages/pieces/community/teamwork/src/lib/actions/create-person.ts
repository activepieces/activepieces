import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamworkAuth } from '../common/auth';
import { teamworkCommon } from '../common/client';

export const createPerson = createAction({
    name: 'create_person',
    displayName: 'Create Person',
    description: 'Create a new person/user in Teamwork',
    auth: teamworkAuth,
    props: {
        firstName: Property.ShortText({
            displayName: 'First Name',
            description: 'First name of the person',
            required: true,
        }),
        lastName: Property.ShortText({
            displayName: 'Last Name',
            description: 'Last name of the person',
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: 'Email address of the person',
            required: true,
        }),
        companyId: Property.ShortText({
            displayName: 'Company ID',
            description: 'ID of the company this person belongs to',
            required: false,
        }),
        title: Property.ShortText({
            displayName: 'Job Title',
            description: 'Job title of the person',
            required: false,
        }),
        phone: Property.ShortText({
            displayName: 'Phone',
            description: 'Phone number',
            required: false,
        }),
        sendWelcomeEmail: Property.Checkbox({
            displayName: 'Send Welcome Email',
            description: 'Send a welcome email to the new person',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        const { firstName, lastName, email, companyId, title, phone, sendWelcomeEmail } = context.propsValue;

        const personData: any = {
            person: {
                'first-name': firstName,
                'last-name': lastName,
                'email-address': email,
                'company-id': companyId || undefined,
                title: title || undefined,
                'phone-number-mobile': phone || undefined,
                'send-welcome-email': sendWelcomeEmail ? 'true' : 'false',
            }
        };

        // Remove undefined values
        Object.keys(personData.person).forEach(key => {
            if (personData.person[key] === undefined) {
                delete personData.person[key];
            }
        });

        const response = await teamworkCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/people.json',
            body: personData,
        });

        return response;
    },
});
