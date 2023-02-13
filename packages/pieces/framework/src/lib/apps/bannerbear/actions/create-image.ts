import { AuthenticationType } from "../../../common/authentication/core/authentication-type";
import { httpClient } from "../../../common/http/core/http-client";
import { HttpMethod } from "../../../common/http/core/http-method";
import { HttpRequest } from "../../../common/http/core/http-request";
import { createAction } from "../../../framework/action/action";
import { Property } from "../../../framework/property";

export const createImageFromTemplate = createAction({
  name: 'bannerbear_create_image', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Create Image',
  description: 'Create image from Bannerbear template',
  sampleData: {

  },
  props: {
    api_key: Property.ShortText({
      displayName: 'API Key',
      description: 'Bannerbear API Key',
      required: true,
    }),
    template_id: Property.ShortText({
      displayName: 'Template Id',
      description: 'The uid of the template to use in image creation.',
      required: true,
    }),
    modifications: Property.Json({
      displayName: 'Template modifications',
      description: 'A list of modifications you want to make on the template.',
      required: true,
    }),
    transparent: Property.Checkbox({
      displayName: 'Transparent background',
      description: 'Render a PNG with a transparent background. Default is false.',
      required: false,
    }),
    render_pdf: Property.Checkbox({
      displayName: 'Render a PDF',
      description: 'Render a PDF instead of a PNG. Default is false.',
      required: false,
    }),
    metadata: Property.LongText({
      displayName: 'Metadata',
      description: 'Any metadata that you need to store e.g. ID of a record in your DB.',
      required: false,
    }),
    template_version: Property.Number({
      displayName: 'Template version',
      description: 'Create image based on a specific version of the template.',
      required: false,
    }),
    webhook_url: Property.Json({
      displayName: 'Metadata',
      description: 'Any metadata that you need to store e.g. ID of a record in your DB.',
      required: false,
    }),
  },
  async run(context) {
    const body = {
      template: context.propsValue.template_id,
      modifications: context.propsValue.modifications || [],
      transparent: context.propsValue.transparent,
      render_pdf: context.propsValue.render_pdf,
      metadata: context.propsValue.metadata,
      template_version: context.propsValue.template_version,
      webhook_url: context.propsValue.webhook_url
    }
    
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://sync.api.bannerbear.com/v2/images`,
      body: JSON.stringify(body),
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.propsValue.api_key!
      }
    }

    const result = await httpClient.sendRequest(request)
    console.debug("Image creation complete", result)

    if (result.status === 200 || result.status === 202) {
      return result.body
    } else {
      return result
    }
  }
})