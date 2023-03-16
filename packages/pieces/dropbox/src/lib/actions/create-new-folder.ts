import { createAction, Property, HttpRequest, HttpMethod, AuthenticationType, httpClient } from "@activepieces/framework"

export const dropboxCreateNewFolder = createAction({
  name: 'create_new_dropbox_folder',
  description: 'Create a new empty folder in your Dropbox',
  displayName: 'Create New Folder',
  props: {
    authentication: Property.OAuth2({
      description: "",
      displayName: 'Authentication',
      authUrl: "https://www.dropbox.com/oauth2/authorize",
      tokenUrl: "https://api.dropboxapi.com/oauth2/token",
      required: true,
      scope: ["files.content.write"]
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'The path of the new folder e.g. /Homework/math',
      required: true
    }),
    autorename: Property.Checkbox({
      displayName: 'Auto Rename',
      description: "If there's a conflict, have the Dropbox server try to autorename the folder to avoid the conflict. The default for this field is False.",
      required: false
    })
  },
  sampleData: {
    "metadata": {
      "id": "id:a4ayc_80_OEAAAAAAAAAXz",
      "name": "math",
      "path_display": "/Homework/math",
      "path_lower": "/homework/math",
      "property_groups": [
        {
          "fields": [
            {
              "name": "Security Policy",
              "value": "Confidential"
            }
          ],
          "template_id": "ptid:1a5n2i6d3OYEAAAAAAAAAYa"
        }
      ],
      "sharing_info": {
        "no_access": false,
        "parent_shared_folder_id": "84528192421",
        "read_only": false,
        "traverse_only": false
      }
    }
  },
  async run(context) {
    const body = {
      autorename: context.propsValue.autorename ? true : false,
      path: context.propsValue.path,
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.dropboxapi.com/2/files/create_folder_v2`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.propsValue.authentication.access_token,
      }
    }

    const result = await httpClient.sendRequest(request)
    console.debug("Folder creation response", result)

    if (result.status == 200) {
      return result.body
    } else {
      return result
    }
  }
})
