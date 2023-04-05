import {  AuthenticationType, HttpMethod, Property, httpClient } from '@activepieces/framework'


export const surveryMonkeyProps = {
  // authentication: Property.OAuth2({
  //   displayName: 'Authentication',
  //   description: 'OAuth Authentication',
  //   required: true,
  //   authUrl: 'https://api.surveymonkey.com/oauth/authorize',
  //   tokenUrl: 'https://api.surveymonkey.com/oauth/token',
  //   scope: [
  //     "webhooks_read",
  //     "webhooks_write"
  //   ]
  // }),
  authentication: Property.SecretText({
    displayName: 'Authentication',
    description: 'OAuth Authenticatin',
    required: true,
  }),
  survey_ids: Property.MultiSelectDropdown({
    displayName: 'Survery Ids',
    description: 'Object type to filter events by: survey or collector. NOTE: Setting object_type to collector and event_type to collector_created will result in a 400 error.',
    required: true,
    defaultValue: [],
    refreshers: ['authentication'],
    options: async ({ authentication }) => {
      if (!authentication)
        return { disabled: true, options: [], placeholder: 'Please authenticate first.' }

      const response = await httpClient.sendRequest<SurveyList>({
        method: HttpMethod.GET,
        url: 'https://api.surveymonkey.com/v3/surveys',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: (authentication as string)
        }
      })

      if (response.status === 200) {
        return {
          disabled: false,
          options: response.body.data.map((survey) => {
            return {
              label: survey.title,
              value: survey.id
            }
          })
        }
      }

      return {
        disabled: true,
        options: [],
        placeholder: "Error processing surveys"
      }
    }
  })
}

interface SurveyList {
  data: Survey[]
  per_page: number
  page: number
  total: number
  links: {
    self: string
    next?: string
    last?: string
  }
}

interface Survey {
  id: string
  title: string
  nickname: string
  href: string
}