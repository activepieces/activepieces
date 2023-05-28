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
    }),
    absenceType: (required = true) => Property.StaticDropdown({
        displayName: 'Type',
        required,
        options: {
            options: [
                { value: 1, label: 'Regular holiday' },
                { value: 2, label: 'Special leaves' },
                { value: 3, label: 'Reduction of overtime' },
                { value: 4, label: 'Sick day' },
                { value: 5, label: 'Sick day of a child' },
                { value: 6, label: 'School / further education' },
                { value: 7, label: 'Maternity protection' },
                { value: 8, label: 'Home office (planned hours are applied)' },
                { value: 9, label: 'Work out of office (planned hours are applied)' },
                { value: 10, label: 'Special leaves (unpaid)' },
                { value: 11, label: 'Sick day (unpaid)' },
                { value: 12, label: 'Sick day of child (unpaid)' },
                { value: 13, label: 'Quarantine' },
                { value: 14, label: 'Military / alternative service (only full days)' },
                { value: 15, label: 'Sick day (sickness benefit)' }
            ]
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

export function currentYear(): number {
    const todaysDate = new Date()
    return todaysDate.getFullYear()
}

export function reformatDateTime(s?: string): string|undefined {
    if(!s)
        return undefined
    return s.replace(/\.[0-9]{3}/, '')
}

export function reformatDate(s?: string): string|undefined {
    if(!s)
        return undefined
    return s.split('T', 2) [0]
}