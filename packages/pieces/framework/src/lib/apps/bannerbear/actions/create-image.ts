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
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'Any metadata that you need to store e.g. ID of a record in your DB.',
      required: false,
    }),
  },
  async run(context) {

  }
})