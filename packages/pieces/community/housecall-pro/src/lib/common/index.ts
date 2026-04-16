import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { AppConnectionValueForAuthProperty, PieceAuth } from '@activepieces/pieces-framework'

export { addJobAttachment } from '../actions/add-job-attachment'
export { addJobLineItem } from '../actions/add-job-line-item'
export { addJobNote } from '../actions/add-job-note'
export { addJobTag } from '../actions/add-job-tag'
export { bulkUpdateJobInputMaterials } from '../actions/bulk-update-job-input-materials'
export { bulkUpdateJobLineItems } from '../actions/bulk-update-job-line-items'
export { convertLeadToEstimateOrJob } from '../actions/convert-lead-to-estimate-or-job'
// Action imports
// Customer actions
export { createCustomer } from '../actions/create-customer'
export { createCustomerAddress } from '../actions/create-customer-address'
// Estimate actions
export { createEstimate } from '../actions/create-estimate'
export { createEstimateOptionAttachment } from '../actions/create-estimate-option-attachment'
export { createEstimateOptionLink } from '../actions/create-estimate-option-link'
export { createEstimateOptionNote } from '../actions/create-estimate-option-note'
// Job actions
export { createJob } from '../actions/create-job'
export { createJobAppointment } from '../actions/create-job-appointment'
export { createJobLink } from '../actions/create-job-link'
// Lead actions
export { createLead } from '../actions/create-lead'
export { deleteEstimateOptionNote } from '../actions/delete-estimate-option-note'
export { deleteJobAppointment } from '../actions/delete-job-appointment'
export { deleteJobLineItem } from '../actions/delete-job-line-item'
export { deleteJobNote } from '../actions/delete-job-note'
export { deleteJobSchedule } from '../actions/delete-job-schedule'
export { dispatchJobToEmployees } from '../actions/dispatch-job-to-employees'
export { getCustomer } from '../actions/get-customer'
export { getCustomerAddress } from '../actions/get-customer-address'
export { getCustomerAddresses } from '../actions/get-customer-addresses'
export { getCustomers } from '../actions/get-customers'
export { getEstimate } from '../actions/get-estimate'
export { getEstimates } from '../actions/get-estimates'
export { getJob } from '../actions/get-job'
export { getJobAppointments } from '../actions/get-job-appointments'
export { getJobInputMaterials } from '../actions/get-job-input-materials'
export { getJobInvoices } from '../actions/get-job-invoices'
export { getJobLineItems } from '../actions/get-job-line-items'
export { getJobs } from '../actions/get-jobs'
export { getLead } from '../actions/get-lead'
export { getLeads } from '../actions/get-leads'
export { lockJob } from '../actions/lock-job'
export { lockJobs } from '../actions/lock-jobs'
export { removeJobTag } from '../actions/remove-job-tag'
export { updateCustomer } from '../actions/update-customer'
export { updateEstimateOptionSchedule } from '../actions/update-estimate-option-schedule'
export { updateJobAppointment } from '../actions/update-job-appointment'
export { updateJobLineItem } from '../actions/update-job-line-item'
export { updateJobSchedule } from '../actions/update-job-schedule'

export const baseUrl = 'https://api.housecallpro.com'

export const housecallProAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: 'Your Housecall Pro API Key. You can find it in your Housecall Pro account settings under API.',
    required: true,
    validate: async ({ auth }) => {
        try {
            // Validate the API key by making a simple request to get customers
            const response = await httpClient.sendRequest({
                url: `${baseUrl}/customers`,
                method: HttpMethod.GET,
                headers: {
                    Authorization: `Token ${auth}`,
                    'Content-Type': 'application/json',
                },
                queryParams: {
                    page_size: '1', // Just get one to validate
                },
            })

            if (response.status === 200) {
                return {
                    valid: true,
                }
            } else {
                return {
                    valid: false,
                    error: 'Invalid API key or insufficient permissions',
                }
            }
        } catch (error) {
            return {
                valid: false,
                error: 'Unable to validate API key. Please check your API credentials.',
            }
        }
    },
})

// Common API functions
export async function makeHousecallProRequest(
    auth: AppConnectionValueForAuthProperty<typeof housecallProAuth>,
    endpoint: string,
    method: HttpMethod = HttpMethod.GET,
    body?: any,
    queryParams?: Record<string, string>,
) {
    const fullUrl = `${baseUrl}${endpoint}`

    return await httpClient.sendRequest({
        url: fullUrl,
        method,
        headers: {
            Authorization: `Token ${auth.secret_text}`,
            'Content-Type': 'application/json',
        },
        body,
        queryParams,
    })
}

export interface HousecallProCustomer {
    id?: number
    first_name: string
    last_name: string
    email?: string
    phone?: string
    mobile?: string
    company?: string
    address?: string
    city?: string
    state?: string
    zip?: string
    notes?: string
    tags?: string[]
    created_at?: string
    updated_at?: string
}

export interface HousecallProJob {
    id?: number
    customer_id: number
    title: string
    description?: string
    work_status?: string
    scheduled_date?: string
    scheduled_time?: string
    duration?: number
    address?: string
    city?: string
    state?: string
    zip?: string
    notes?: string
    created_at?: string
    updated_at?: string
}

export interface HousecallProEstimate {
    id?: number
    customer_id: number
    job_id?: number
    title: string
    description?: string
    status?: string
    total_amount?: number
    valid_until?: string
    notes?: string
    created_at?: string
    updated_at?: string
}
