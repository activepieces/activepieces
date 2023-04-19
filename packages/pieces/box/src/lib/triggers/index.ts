import { Property } from "@activepieces/pieces-framework"
import { boxRegisterTrigger } from "./register"
import { sampleData } from "./sample-data"

const triggerData = [
  {
    name: 'file_uploaded',
    displayName: "File Uploaded",
    description: 'Triggers on file upload',
    event: 'FILE.UPLOADED',
    sampleData: sampleData.file_uploaded,
    props: {
      id: Property.ShortText({
        displayName: 'Folder ID',
        description: 'The parent/containing folder of the file to trigger this webhook',
        required: false,
        defaultValue: '0'
      }),
      type: Property.StaticDropdown({
        displayName: 'Item Type',
        description: 'The type of the item to trigger a webhook',
        required: false,
        defaultValue: 'folder',
        options: {
          disabled: true,
          options: [
            { label: "Folder", value: "folder" }
          ]
        }
      })
    }
  },
  {
    name: 'folder_created',
    displayName: "Folder Created",
    description: 'Triggers on folder creation',
    event: 'FOLDER.CREATED',
    sampleData: sampleData.folder_created,
    props: {
      id: Property.ShortText({
        displayName: 'Folder ID',
        description: 'The parent/containing folder of the file to trigger this webhook',
        required: false,
        defaultValue: "0"
      }),
      type: Property.StaticDropdown({
        displayName: 'Item Type',
        description: 'The type of the item to trigger a webhook',
        required: false,
        defaultValue: 'folder',
        options: {
          disabled: true,
          options: [
            { label: "Folder", value: "folder" }
          ]
        }
      })
    }
  },
  {
    name: 'comment_created',
    displayName: "Comment Created",
    description: 'Triggers on comment creation',
    event: 'COMMENT.CREATED',
    sampleData: sampleData.comment_created,
    props: {
      id: Property.ShortText({
        displayName: 'File/Folder ID',
        description: 'The ID of the item to trigger a webhook',
        required: true
      }),
      type: Property.StaticDropdown({
        displayName: 'Item Type',
        description: 'The type of the item to trigger a webhook',
        required: true,
        options: {
          options: [
            { label: "File", value: "file" },
            { label: "Folder", value: "folder" }
          ]
        }
      })
    }
  }
]

export const boxTriggers = triggerData.map((trigger) => boxRegisterTrigger(trigger))