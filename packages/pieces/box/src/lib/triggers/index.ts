import { boxRegisterTrigger } from "./register"

const triggerData = [
  {
    name: 'file_uploaded',
    displayName: "File Uploaded",
    description: 'Triggers on `FILE.UPLOADED`',
    event: 'FILE.UPLOADED',
    sampleData: {}
  },
  {
    name: 'file_downloaded',
    displayName: "File Downloaded",
    description: 'Triggers on `FILE.DOWNLOADED`',
    event: 'FILE.DOWNLOADED',
    sampleData: {}
  },
  {
    name: 'file_deleted',
    displayName: "File Deleted",
    description: 'Triggers on `FILE.DELETED`',
    event: 'FILE.DELETED',
    sampleData: {}
  },
  {
    name: 'folder_created',
    displayName: "Folder Created",
    description: 'Triggers on `FOLDER.CREATED`',
    event: 'FOLDER.CREATED',
    sampleData: {}
  },
  {
    name: 'folder_downloaded',
    displayName: "Folder Downloaded",
    description: 'Triggers on `FOLDER.DOWNLOADED`',
    event: 'FOLDER.DOWNLOADED',
    sampleData: {}
  },
  {
    name: 'folder_deleted',
    displayName: "Folder Deleted",
    description: 'Triggers on `FOLDER.DELETED`',
    event: 'FOLDER.DELETED',
    sampleData: {}
  }
]

export const boxTriggers = triggerData.map((trigger) => boxRegisterTrigger(trigger))