import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'
import { hubspotAuth } from '../../'
import { workflowIdDropdown } from '../common/props'

export const addContactToWorkflowAction = createAction({
  auth: hubspotAuth,
  name: 'add-contact-to-workflow',
  displayName: 'Add Contact to Workflow',
  description: 'Adds a contact to a specified workflow in your HubSpot account.',
  props: {
    workflowId: workflowIdDropdown,
    email: Property.ShortText({
      displayName: "Contact's Email",
      description: 'The email of the contact to add to the workflow.',
      required: true,
    }),
  },
  async run(context) {
    const contactEmail = context.propsValue.email
    const workflowId = context.propsValue.workflowId

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.hubapi.com/automation/v2/workflows/${workflowId}/enrollments/contacts/${contactEmail}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    })

    return response
  },
})
