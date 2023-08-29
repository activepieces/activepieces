import { Property } from "@activepieces/pieces-framework";

export interface pineconeIndex {
  name: string
  permissionLevel: pineconePermissionLevel
}



declare type pineconePermissionLevel = "none" | "read" | "comment" | "edit" | "create";