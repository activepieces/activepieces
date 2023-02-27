import { AuthenticationType, createAction, httpClient, HttpMethod, HttpRequest, Property } from "@activepieces/framework"

const cleanName = (name: string):
  string => name.replace(" ", "").toLowerCase()

export const createThing = createAction({
  name: 'bubble_create_thing',
  displayName: 'Create a thing',
  description: 'Creates a thing in bubble.io database',
  props: {
    api_key: Property.SecretText({
      displayName: "API Key",
      description: "The meeting's topic",
      required: true,
    }),
    app_name: Property.ShortText({
      displayName: "Application name",
      description: "The name of the bubble application",
      required: true,
    }),
    thing: Property.Dropdown({
      displayName: "Thing",
      description: "The thing/object to create",
      required: true,
      refreshers: ["app_name", "api_key"],
      options: async ({ app_name, api_key }) => {
        if (!app_name) {
          return {
            disabled: true,
            options: [],
            placeholder: "Please enter your App name."
          }
        }
        if (!api_key == null) {
          return {
            disabled: true,
            options: [],
            placeholder: "Please enter your API Key first."
          }
        }

        const url = `https://${cleanName(app_name as string)}.bubbleapps.io/version-test/api/1.1/meta`
        const request: HttpRequest = {
          method: HttpMethod.GET,
          url,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: api_key as string
          }
        }
        const { body: meta } = await httpClient.sendRequest<MetaResponse>(request)
        return {
          disabled: false,
          options: Object.keys(meta.types).map((key) => ({
            label: meta.types[key].display,
            value: meta.types[key]
          }))
        };
      }
    }),
    fields: Property.Object({
      displayName: "Fields",
      description: "Use the test version of the API",
      required: true
    }),
    use_test_version: Property.Checkbox({
      displayName: "Use test version",
      description: "Use the test version of the API",
      required: true
    })
  },
  sampleData: {
    "status": "success",
    "id": "1676806107619x783812560224237200"
  },

  async run(context) {
    const { api_key, app_name, use_test_version, thing, fields } = context.propsValue
    const url = `https://${cleanName(app_name as string)}.bubbleapps.io${!use_test_version ? '/' : '/version-test/'}api/1.1/obj/${cleanName(thing.display as string)}`

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url,
      body: fields ? fields : {},
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: api_key as string
      },
      queryParams: {}
    }

    const result = await httpClient.sendRequest(request)
    console.debug("Thing creation response", result)

    if (result.status === 201) {
      return result.body
    } else {
      return result
    }
  }
})

interface MetaResponse {
  get: string[]
  post: string[]
  types: {
    [key: string]: {
      display: string
      fields: {
        id: string,
        display: string,
        type: string
      }[]
    }
  },
  app_data: {
    appname: string
    favicon: string
    app_version: string
    use_captions_for_get: boolean
  }
}