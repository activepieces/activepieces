
export interface KizeoFormsForms {
  id: string
  name: string
  fields: Record<string, KizeoFormsFields>
}
export interface KizeoFormsFields{
    caption: string
    type: string
    required: boolean
}
export interface KizeoFormsDataExports {
    exports:KizeoFormsExports[]
}
export interface KizeoFormsExports{
    id: string
    name: string
}
export interface KizeoFormsDataUsers {
    users:KizeoFormsUsers[]
}
export interface KizeoFormsUsers{
    id: string
    login: string
    first_name: string
    last_name: string
}
