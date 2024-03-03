export const accessControlledResourceNames = [
    'activities',
    'app-connections',
    'flows',
    'project-members',
] as const

export type ResourceName = typeof accessControlledResourceNames[number]

export type ResourceAction =
    | 'DELETE'
    | 'GET'
    | 'POST'
