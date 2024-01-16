import { DynamicPropsValue, Property, createAction } from "@activepieces/pieces-framework";

export const writeFileAction = createAction({
  name: 'write_file',
  displayName: 'Write File',
  description: 'Write to a file in the filesystem and return a reference',
  props: {
    filename: Property.ShortText({
      displayName: "File name",
      description: "The name to save the file as",
      required: true
    }),
    content_type: Property.StaticDropdown({
      displayName: "Content",
      description: "Text file content",
      required: true,
      defaultValue: "text",
      options: {
        options: [
          {label: "Text", value: "text"},
          {label: "JSON", value: "json"}
        ]
      }
    }),
    content: Property.DynamicProperties({
      displayName: "Content",
      description: "Text file content",
      required: true,
      refreshers: ['content_type'],
      props: async ({ content_type }) => {
        if  ((content_type as unknown as string) === "json") {
          return {
            content: Property.Json({
              displayName: "JSON Content",
              description: "JSON file content",
              required: true
            })
          } as DynamicPropsValue
        }

        return {
          content: Property.LongText({
            displayName: "Text Content",
            description: "Text file content",
            required: true,
          })
        } as DynamicPropsValue
      }
    })
  },
  async run(context) {
    return {
      file: await context.files.write({
        fileName: context.propsValue.filename,
        data: Buffer.from(context.propsValue.content['content'] as unknown as string)
      })
    }
  }
});