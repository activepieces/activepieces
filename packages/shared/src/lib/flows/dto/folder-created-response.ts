import { Folder } from "../folders/folder";

export interface FolderCreatedResponse extends Folder {
    numberOfFlows:number
}