import { DynamicPropsValue, Property, createAction } from '@activepieces/pieces-framework'
import { google } from 'googleapis'
import { OAuth2Client } from 'googleapis-common'
import { googleSlidesAuth } from '../../index'
import { PageElement, batchUpdate, getSlide } from '../commons/common'

export const generateFromTemplate = createAction({
  name: 'generate_from_template',
  displayName: 'Generate from template',
  description: 'Generate a new slide from a template',
  auth: googleSlidesAuth,
  props: {
    template_presentation_id: Property.ShortText({
      displayName: 'Template presentation ID',
      description: 'The ID of the templated presentation',
      required: true,
    }),
    table_data: Property.DynamicProperties({
      displayName: 'Table Data',
      required: true,
      refreshers: ['template_presentation_id'],
      props: async ({ auth, template_presentation_id }) => {
        if (!template_presentation_id || !auth) return {}

        const presentation = await getSlide(
          auth['access_token'] as unknown as string,
          template_presentation_id as unknown as string,
        )
        if (!presentation) return {}

        const fields = {
          title: Property.ShortText({
            displayName: 'Presentation Title',
            description: 'Title of the new presentation',
            defaultValue: `Copy of: ${presentation.title}`,
            required: true,
          }),
        } as DynamicPropsValue

        presentation.slides?.forEach((slide) => {
          slide.pageElements?.forEach((element: PageElement) => {
            if (element.shape?.text?.textElements) {
              element.shape.text.textElements.forEach((textElement) => {
                const content = textElement?.textRun?.content
                if (content) {
                  const matches = content.match(/\{\{([^}]+)\}\}/g)
                  if (matches) {
                    matches.forEach((match: string) => {
                      const matchValue = match.replace(/[{}]/g, '')
                      const varName = matchValue.trim()
                      fields[matchValue] = Property.ShortText({
                        displayName: varName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                        description: `Value for "${matchValue}"`,
                        required: false,
                      })
                    })
                  }
                }
              })
            }
          })
        })

        return fields
      },
    }),
  },
  async run(context) {
    const { access_token } = context.auth
    const { template_presentation_id, table_data } = context.propsValue

    try {
      const authClient = new OAuth2Client()
      authClient.setCredentials(context.auth)

      const drive = google.drive({ version: 'v3', auth: authClient })

      const copyResponse = await drive.files.copy({
        fileId: template_presentation_id as string,
        requestBody: {
          name: table_data['title'] || 'New Presentation',
        },
        supportsAllDrives: true,
      })

      const newPresentationId = copyResponse.data.id
      if (!newPresentationId) return

      const requests = Object.entries(table_data).map(([key, value]): { replaceAllText: unknown } => {
        return {
          replaceAllText: {
            containsText: {
              text: `{{${key}}}`,
              matchCase: true,
            },
            replaceText: value as string,
          },
        }
      })

      if (requests.length > 0) {
        await batchUpdate(access_token, newPresentationId, requests)
      }

      return {
        presentationId: newPresentationId,
        presentationUrl: `https://docs.google.com/presentation/d/${newPresentationId}/edit`,
      }
    } catch (error) {
      console.error('Error creating presentation:', error)
      throw error
    }
  },
})
