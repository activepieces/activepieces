export type WorkspaceResponse =  { data: Workspace[] } 
export type OrganizationResponse ={ data: Organization[] } 
export type TableResponse =  { data: Table[] } 
export type TableColumnResponse =  { data: TableColumn[] } 
export type TableRowResponse =  { data: TableRow[] } 

export interface Workspace {
  ROWID: string
  name: string
}
export interface Table {
  ROWID: string
  name: string
}
export interface Organization {
  ROWID: string
  name: string
}

export interface TableRow {
  ROWID: string
  tableID: string
  spaceID: string
  dataRow: string
}
export interface TableColumn {
  ROWID: string,
  columnNmae: string,
  properties:string,
  tableID: string
  spaceID: string
  
}

export interface User {
  ROWID: string
  firstName: string
  lastName: string
  email: string
}

export type Webhook = {
  ROWID: string;
  tableId?: string;
  organizationId?: string;
  webhookUrl: string;
  triggerType?: string;
};

export type WebhookResponse = { data: Webhook };
