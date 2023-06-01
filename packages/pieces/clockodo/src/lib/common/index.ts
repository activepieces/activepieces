import { Property, StaticPropsValue } from "@activepieces/pieces-framework"
import { ClockodoClient } from "./client";

export function makeClient(propsValue: StaticPropsValue<any>): ClockodoClient {
    return new ClockodoClient(
        propsValue.authentication.email,
        propsValue.authentication.token,
        propsValue.authentication.company_name,
        propsValue.authentication.company_email,
    )
}

export const clockodoCommon = {
    authentication: Property.CustomAuth({
        displayName: "Authentication",
        required: true,
        props: {
            email: Property.ShortText({
                displayName: 'E-Mail',
                required: true,
                description: "The email of your clockodo user"
            }),
            token: Property.SecretText({
                displayName: 'API-Token',
                description: "Your api token (can be found in profile settings)",
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
    }),
    customer_id: (required = true, active: boolean|null = true) => Property.Dropdown({
        description: 'The ID of the customer',
        displayName: 'Customer',
        required,
        refreshers: ['authentication'],
        options: async (value) => {
            if (!value['authentication']) {
                return {
                    disabled: true,
                    placeholder: 'setup authentication first',
                    options: []
                };
            }
            const client = makeClient(value)
            const customers = await client.listAllCustomers({ active: active === null ? undefined : active })
            return {
                disabled: false,
                options: customers.map((customer) => {
                    return {
                        label: customer.name,
                        value: customer.id
                    }
                })
            }
        }
    }),
    project_id: (required = true, requiresCustomer = true, active: boolean|null = true) => Property.Dropdown({
        description: 'The ID of the project',
        displayName: 'Project',
        required,
        refreshers: ['authentication', ...(requiresCustomer ? ['customer_id'] : [])],
        options: async (value) => {
            if (!value['authentication']) {
                return {
                    disabled: true,
                    placeholder: 'setup authentication first',
                    options: []
                }
            }
            if (requiresCustomer && !value['customer_id']) {
                return {
                    disabled: true,
                    placeholder: 'select a customer first',
                    options: []
                }
            }
            const client = makeClient(value)
            const projects = await client.listAllProjects({
                active: active === null ? undefined : active,
                customers_id: requiresCustomer ? parseInt(value.customer_id as string) : undefined
            })
            return {
                disabled: false,
                options: projects.map((project) => {
                    return {
                        label: project.name,
                        value: project.id
                    }
                })
            }
        }
    }),
    user_id: (required = true, active: boolean|null = true) => Property.Dropdown({
        description: 'The ID of the user',
        displayName: 'User',
        required,
        refreshers: ['authentication'],
        options: async (value) => {
            if (!value['authentication']) {
                return {
                    disabled: true,
                    placeholder: 'setup authentication first',
                    options: []
                };
            }
            const client = makeClient(value)
            const usersRes = await client.listUsers()
            return {
                disabled: false,
                options: usersRes.users.filter(u => active === null || u.active === active).map((user) => {
                    return {
                        label: user.name,
                        value: user.id
                    }
                })
            }
        }
    }),
    team_id: (required = true) => Property.Dropdown({
        description: 'The ID of the team',
        displayName: 'Team',
        required,
        refreshers: ['authentication'],
        options: async (value) => {
            if (!value['authentication']) {
                return {
                    disabled: true,
                    placeholder: 'setup authentication first',
                    options: []
                };
            }
            const client = makeClient(value)
            const teamsRes = await client.listTeams()
            return {
                disabled: false,
                options: teamsRes.teams.map((team) => {
                    return {
                        label: team.name,
                        value: team.id
                    }
                })
            }
        }
    }),
    service_id: (required = true, active: boolean|null = true) => Property.Dropdown({
        description: 'The ID of the service',
        displayName: 'Service',
        required,
        refreshers: ['authentication'],
        options: async (value) => {
            if (!value['authentication']) {
                return {
                    disabled: true,
                    placeholder: 'setup authentication first',
                    options: []
                };
            }
            const client = makeClient(value)
            const servicesRes = await client.listServices()
            return {
                disabled: false,
                options: servicesRes.services.filter(s => active === null || s.active === active).map((service) => {
                    return {
                        label: service.name,
                        value: service.id
                    }
                })
            }
        }
    }),
    language: (required = true) => Property.StaticDropdown({
        displayName: 'Language',
        required,
        options: {
            options: [
                { label: 'German', value: 'de' },
                { label: 'English', value: 'en' },
                { label: 'French', value: 'fr' }
            ]
        }
    }),
    color: (required = true) => Property.StaticDropdown({
        displayName: 'Color',
        required,
        options: {
            options: [
                { label: 'Orange', value: 0xEE9163 },
                { label: 'Yellow', value: 0xF0D758 },
                { label: 'Green', value: 0x9DE34A },
                { label: 'Caribean', value: 0x39E6CA },
                { label: 'Lightblue', value: 0x56C6F9 },
                { label: 'Blue', value: 0x3657F7 },
                { label: 'Purple', value: 0x7B4BE7 },
                { label: 'Magenta', value: 0xD065E6 },
                { label: 'Pink', value: 0xFC71D1 },
            ]
        }
    })
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