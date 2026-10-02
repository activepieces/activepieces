function personalProjectsActive({ autoCreatePersonalProjects, activeDefaultProjectIds }: PersonalProjectsActiveParams): boolean {
    return autoCreatePersonalProjects || activeDefaultProjectIds.length === 0
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
    activeDefaultProjectIds: string[]
}

type ActiveDefaultProjectIdsParams = {
    defaultProjectIds: string[]
    projectRolesEnabled: boolean
}
