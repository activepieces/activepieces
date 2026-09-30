function activeDefaultProjectIds({ defaultProjectIds, projectRolesEnabled }: ActiveDefaultProjectIdsParams): string[] {
    return projectRolesEnabled ? defaultProjectIds : []
}

export const newMemberSettingsUtils = {
    activeDefaultProjectIds,
}

type ActiveDefaultProjectIdsParams = {
    defaultProjectIds: string[]
    projectRolesEnabled: boolean
}
