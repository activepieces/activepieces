import { AuthenticationType } from "../../../common/authentication/core/authentication-type";
import { httpClient } from "../../../common/http/core/http-client";
import { HttpMethod } from "../../../common/http/core/http-method";
import { HttpRequest } from "../../../common/http/core/http-request";
import { createAction } from "../../../framework/action/action";
import { Property } from "../../../framework/property";

export const googleContactsAddContactAction = createAction({
    name: 'add_contact',
    description: 'Add a contact to a Google Contacts account',
    displayName: 'Add Contact',
    props: {
        authentication: Property.OAuth2({
            description: "",
            displayName: 'Authentication',
            authUrl: "https://accounts.google.com/o/oauth2/auth",
            tokenUrl: "https://oauth2.googleapis.com/token",
            required: true,
            scope: ["https://www.googleapis.com/auth/contacts"]
        }),
        firstName: Property.ShortText({
            displayName: 'First Name',
            description: 'The first name of the contact',
            required: true,
        }),
        middleName: Property.ShortText({
            displayName: 'Middle Name',
            description: 'The middle name of the contact',
            required: false,
        }),
        lastName: Property.ShortText({
            displayName: 'Last Name',
            description: 'The last name of the contact',
            required: true,
        }),
        jobTitle: Property.ShortText({
            displayName: 'Job Title',
            description: 'The job title of the contact',
            required: false,
        }),
        company: Property.ShortText({
            displayName: 'Company',
            description: 'The company of the contact',
            required: false,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: 'The email address of the contact',
            required: false,
        }),
        phoneNumber: Property.ShortText({
            displayName: 'Phone Number',
            description: 'The phone number of the contact',
            required: false,
        }),
    },
    async run(context) {
        const requestBody = {
            resource: {
                names: [
                    {
                        givenName: context.propsValue['firstName'],
                        middleName: context.propsValue['middleName'],
                        familyName: context.propsValue['lastName'],
                    }
                ],
                emailAddresses: [
                    {
                        value: context.propsValue['email'],
                        primary: true
                    }
                ],
                phoneNumbers: [
                    {
                        value: context.propsValue['phoneNumber'],
                        primary: true
                    }
                ],
                organizations: [
                    {
                        name: context.propsValue['company'],
                        title: context.propsValue['jobTitle']
                    }
                ]
            }
        };
        const request: HttpRequest<Record<string, unknown>> = {
            method: HttpMethod.POST,
            url: `https://people.googleapis.com/v1/people:createContact`,
            body: requestBody,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.propsValue['authentication']!['access_token'],
            }
        }
        return await httpClient.sendRequest(request);
    }
});