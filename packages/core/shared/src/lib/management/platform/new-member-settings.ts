import { z } from 'zod'

function personalProjectsActive({ autoCreatePersonalProjects, projectRolesEnabled }: PersonalProjectsActiveParams): boolean {
    return autoCreatePersonalProjects || !projectRolesEnabled
}

function activeDefaultProjectIds({ defaultProjectIds, projectRolesEnabled }: ActiveDefaultProjectIdsParams): string[] {
    return projectRolesEnabled ? defaultProjectIds : []
}

export const newMemberSettingsUtils = {
    personalProjectsActive,
    activeDefaultProjectIds,
}

type PersonalProjectsActiveParams = {
    autoCreatePersonalProjects: boolean
    projectRolesEnabled: boolean
}

type ActiveDefaultProjectIdsParams = {
    defaultProjectIds: string[]
    projectRolesEnabled: boolean
}

export const PersonalProjectsSummary = z.object({
    personalProjectCount: z.number(),
    membersWithoutPersonalProject: z.number(),
})
export type PersonalProjectsSummary = z.infer<typeof PersonalProjectsSummary>
