import { ActionContext, Property, StaticPropsValue } from "@activepieces/pieces-framework"
import { ClockodoClient } from "./client";

export const clockodoCommon = {
    authentication: Property.CustomAuth({
        displayName: "Authentication",
        required: true,
        props: {
            email: Property.ShortText({
                displayName: 'E-Mail',
                required: true,
                description: "A string indicating the user to authenticate as when connecting to the PostgreSQL server."
            }),
            token: Property.SecretText({
                displayName: 'API-Token',
                description: "A string indicating the password to use for authentication.",
                required: true,
            }),
            company_name: Property.ShortText({
                displayName: 'Company Name',
                description: "Your company name or app name",
                required: true,
            }),
            company_email: Property.ShortText({
                displayName: 'Company E-Mail',
                description: "A contact email for your company or app",
                required: true,
            })
        }
    })
}

export function makeClient(context: ActionContext<StaticPropsValue<any>>): ClockodoClient {
    return new ClockodoClient(
        context.propsValue.authentication.email,
        context.propsValue.authentication.token,
        context.propsValue.authentication.company_name,
        context.propsValue.authentication.company_email,
    )
}

export function emptyToNull(val?: string): undefined|string|null {
    return val === undefined ? val : (val || null)
}