import { AuthenticationType, createAction, DynamicPropsValue, httpClient, HttpMethod, HttpRequest, Property } from "@activepieces/framework"

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
    thing: Property.Dropdown<BubbleThing>({
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
        const { body: meta } = await httpClient.sendRequest<BubbleMetaResponse>(request)
        return {
          disabled: false,
          options: Object.keys(meta.types).map((key) => ({
            label: meta.types[key].display,
            value: meta.types[key]
          }))
        };
      }
    }),
    fields: Property.DynamicProperties({
      displayName: "Fields",
      description: "Use the test version of the API",
      required: true,
      refreshers: ["thing"],

      props: async ({ thing }) => {
        if (!thing) return {}
  
        const fields: DynamicPropsValue = {};
  
        (thing as BubbleThing).fields.map((field: BubbleField) => {
          if (BUBBLE_INTERNAL_TYPES.includes(field.id)) {
            return
          }

          const params = {
            displayName: field.display,
            description: field.display,
            required: false
          }
          
          if (field.type === "boolean") {
            fields[field.display] = Property.Checkbox(params)
          } else if (field.type === "Number") {
            fields[field.display] = Property.Number(params)
          } else {
            fields[field.display] = Property.ShortText(params)
          }
        })
  
        return fields
      }
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
    const version = !use_test_version ? '/' : '/version-test/'
    const url = `https://${cleanName(app_name as string)}.bubbleapps.io${version}api/1.1/obj/${cleanName(thing!.display as string)}`

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url,
      body: fields,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: api_key as string
      }
    }

    const result = await httpClient.sendRequest<{
      status: string
      id: string
    }>(request)
    console.debug("Thing creation response", result)

    if (result.status === 201) {
      return result.body
    } else {
      return result
    }
  }
})

const BUBBLE_INTERNAL_TYPES = [
  "_id",
  "Slug",
  "Created Date", 
  "Modified Date", 
  "Created By", 
  "user"
]

interface BubbleThing {
  display: string
  fields: BubbleField[]
}

interface BubbleField {
  id: string,
  display: string,
  type: string
}

interface BubbleMetaResponse {
  get: string[]
  post: string[]
  types: {
    [key: string]: BubbleThing
  },
  app_data: {
    appname: string
    favicon: string
    app_version: string
    use_captions_for_get: boolean
  }
}