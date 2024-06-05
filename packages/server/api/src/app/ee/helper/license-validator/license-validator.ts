export enum LiceneseStatus {
    VALID = 'VALID',
    INVALID = 'INVALID',
    UNKNOWN = 'UNKNOWN',
}

export type SuccessLicenseResponse = {
    status: LiceneseStatus.VALID
    showPoweredBy?: boolean
    ssoEnabled?: boolean
    flowIssuesEnabled?: boolean
    embeddingEnabled?: boolean
    gitSyncEnabled?: boolean
    auditLogEnabled?: boolean
    customAppearanceEnabled?: boolean
    manageProjectsEnabled?: boolean
    managePiecesEnabled?: boolean
    manageTemplatesEnabled?: boolean
    apiKeysEnabled?: boolean
    customDomainsEnabled?: boolean
    projectRolesEnabled?: boolean
    alertsEnabled?: boolean
}
export type LicenseResponse =
  | SuccessLicenseResponse
  | {
      status: LiceneseStatus.INVALID
  }
  | {
      status: LiceneseStatus.UNKNOWN
  }

export type LicenseValidator = {
    validate: () => Promise<LicenseResponse>
}
