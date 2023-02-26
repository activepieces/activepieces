import { createAction, Property, HttpRequest, HttpMethod, httpClient, AuthenticationType, DynamicPropsValue } from '@activepieces/framework';

export const createImageFromTemplate = createAction({
  name: 'bannerbear_create_image', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Create Image',
  description: 'Create image from Bannerbear template',
  sampleData: {
    "created_at": "2023-02-13T23:53:05.445Z",
    "status": "completed",
    "self": "https://api.bannerbear.com/v2/images/VA54EW2ZqQr5eKOP6egGPNXJl",
    "uid": "VA54EW2ZqQr5eKOP6egGPNXJl",
    "image_url": "https://images.bannerbear.com/direct/2by4GqMJbkdMERad9x/requests/000/034/020/670/VA54EW2ZqQr5eKOP6egGPNXJl/0b067422c8a3023c3301a64a5e8fcb8d7099b8ad.png",
    "image_url_png": "https://images.bannerbear.com/direct/2by4GqMJbkdMERad9x/requests/000/034/020/670/VA54EW2ZqQr5eKOP6egGPNXJl/0b067422c8a3023c3301a64a5e8fcb8d7099b8ad.png",
    "image_url_jpg": "https://images.bannerbear.com/direct/2by4GqMJbkdMERad9x/requests/000/034/020/670/VA54EW2ZqQr5eKOP6egGPNXJl/0b067422c8a3023c3301a64a5e8fcb8d7099b8ad.jpg",
    "template": "Rqg32K5QE6Y58V07Y6",
    "template_version": null,
    "modifications": [
      {
        "name": "message",
        "text": "You can change this text",
        "color": null,
        "background": null
      },
      {
        "name": "face",
        "image_url": "https://cdn.bannerbear.com/sample_images/welcome_bear_photo.jpg"
      }
    ],
    "webhook_url": null,
    "webhook_response_code": null,
    "transparent": false,
    "metadata": null,
    "template_name": "Template 1",
    "width": 1200,
    "height": 700,
    "render_pdf": false,
    "pdf_url": null,
    "pdf_url_compressed": null
  },
  props: {
    authentication: Property.SecretText({
      displayName: 'API Key',
      description: 'Bannerbear API Key',
      required: true,
    }),
    template: Property.Dropdown({
      displayName: 'Template Id',
      description: 'The uid of the template to use in image creation.',
      required: true,
      refreshers: ['authentication'],
      options: async ({ authentication }) => {
        if (authentication === undefined) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please enter your API key first.'
          }
        }

        const response = await httpClient.sendRequest<BannerbearTemplate[]>({
          method: HttpMethod.GET,
          url: `https://sync.api.bannerbear.com/v2/templates`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: (authentication as string)
          }
        })

        if (response.status === 200) {
          return {
            disabled: false,
            options: response.body.map((template) => {
              return {
                label: template.name,
                value: template
              }
            })
          }
        }

        return {
          disabled: true,
          options: [],
          placeholder: "Error processing templates"
        }
      }
    }),
    modifications: Property.DynamicProperties({
      displayName: 'Template modifications',
      description: 'A list of modifications you want to make on the template.',
      required: true,
      refreshers: ["authentication", "template"],
      props: async ({ authentication, template }) => {
        if (!authentication) return {}
        if (!template) return {}
  
        const fields: DynamicPropsValue = {};
  
        (template as BannerbearTemplate).available_modifications.map((modification) => {
          
        })
  
        return fields
      }
    }),
    transparent: Property.Checkbox({
      displayName: 'Transparent background',
      description: 'Render a PNG with a transparent background. Default is false.',
      required: false
    }),
    render_pdf: Property.Checkbox({
      displayName: 'Render a PDF',
      description: 'Render a PDF instead of a PNG. Default is false.',
      required: false
    }),
    metadata: Property.LongText({
      displayName: 'Metadata',
      description: 'Any metadata that you need to store e.g. ID of a record in your DB.',
      required: false
    }),
    template_version: Property.Number({
      displayName: 'Template version',
      description: 'Create image based on a specific version of the template.',
      required: false
    })
  },
  async run(context) {
    const body = {
      template: context.propsValue.template,
      modifications: JSON.stringify(context.propsValue.modifications) === "{}" ? [] : context.propsValue.modifications,
      template_version: context.propsValue.template_version,
      transparent: context.propsValue.transparent,
      render_pdf: context.propsValue.render_pdf,
      metadata: context.propsValue.metadata
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://sync.api.bannerbear.com/v2/images`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.propsValue.authentication!
      }
    }

    const result = await httpClient.sendRequest<BannerbearTemplate>(request)
    console.debug("Image creation complete", result)

    if (result.status === 200 || result.status === 202) {
      return result.body
    } else {
      return result
    }
  }
})

interface BannerbearTemplate {
  created_at: string
  name: string
  self: string
  uid: string
  preview_url: number
  width: number
  height: number
  available_modifications: {
    name: string
    image_url?: string
    text?: string
  }[]
  tags: string[]
}
