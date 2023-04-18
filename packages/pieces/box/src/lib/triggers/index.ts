import { boxRegisterTrigger } from "./register"

const triggerData = [
  {
    name: 'file_uploaded',
    displayName: "File Uploaded",
    description: 'Triggers on file upload',
    event: 'FILE.UPLOADED',
    sampleData: {}
  },
  {
    name: 'file_downloaded',
    displayName: "File Downloaded",
    description: 'Triggers on file download',
    event: 'FILE.DOWNLOADED',
    sampleData: {}
  },
  {
    name: 'file_deleted',
    displayName: "File Deleted",
    description: 'Trigger on file deletion',
    event: 'FILE.DELETED',
    sampleData: {}
  },
  {
    name: 'folder_created',
    displayName: "Folder Created",
    description: 'Triggers on folder creation',
    event: 'FOLDER.CREATED',
    sampleData: {}
  },
  {
    name: 'folder_downloaded',
    displayName: "Folder Downloaded",
    description: 'Triggers on folder download',
    event: 'FOLDER.DOWNLOADED',
    sampleData: {}
  },
  {
    name: 'folder_deleted',
    displayName: "Folder Deleted",
    description: 'Triggers on folder deletion',
    event: 'FOLDER.DELETED',
    sampleData: {}
  }
]

export const boxTriggers = triggerData.map((trigger) => boxRegisterTrigger(trigger))