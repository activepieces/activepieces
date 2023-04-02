import { Property } from '@activepieces/framework'
import { boxRegisterTrigger } from "./register"

const itemProps = {
  id: Property.ShortText({
    displayName: 'Item ID',
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

const triggerData = [
  {
    name: 'file_uploaded',
    displayName: "File Uploaded",
    description: 'Triggers on `FILE.UPLOADED`',
    event: 'FILE.UPLOADED',
    props: itemProps,
    sampleData: {}
  },
  {
    name: 'file_downloaded',
    displayName: "File Downloaded",
    description: 'Triggers on `FILE.DOWNLOADED`',
    event: 'FILE.DOWNLOADED',
    props: itemProps,
    sampleData: {}
  },
  {
    name: 'file_deleted',
    displayName: "File Deleted",
    description: 'Triggers on `FILE.DELETED`',
    event: 'FILE.DELETED',
    props: itemProps,
    sampleData: {}
  },
  {
    name: 'folder_created',
    displayName: "Folder Created",
    description: 'Triggers on `FOLDER.CREATED`',
    event: 'FOLDER.CREATED',
    props: itemProps,
    sampleData: {}
  },
  {
    name: 'folder_downloaded',
    displayName: "Folder Downloaded",
    description: 'Triggers on `FOLDER.DOWNLOADED`',
    event: 'FOLDER.DOWNLOADED',
    props: itemProps,
    sampleData: {}
  },
  {
    name: 'folder_deleted',
    displayName: "Folder Deleted",
    description: 'Triggers on `FOLDER.DELETED`',
    event: 'FOLDER.DELETED',
    props: itemProps,
    sampleData: {}
  }
]

export const boxTriggers = triggerData.map((trigger) => boxRegisterTrigger(trigger))