import { isNil } from '@activepieces/core-utils'
import { ActionBase, OutputSchema, OutputSchemaField, PieceAuthProperty, TriggerBase } from '@activepieces/pieces-framework'
import semVer from 'semver'

export const pieceVersionCompatibility = {
    resolveUpgrade: async ({ usage, currentVersion, getMetadata }: ResolveUpgradeParams): Promise<PieceVersionUpgradeDecision> => {
        if (isNil(semVer.valid(currentVersion))) {
            return { outcome: 'skipped', reason: 'NON_EXACT_VERSION' }
        }
        const oldMetadata = await getMetadata({ version: currentVersion })
        if (isNil(oldMetadata)) {
            return { outcome: 'skipped', reason: 'NOT_AN_OFFICIAL_PIECE' }
        }
        const latest = await getMetadata({ version: undefined })
        if (isNil(latest) || semVer.lte(latest.version, currentVersion)) {
            return { outcome: 'skipped', reason: 'ALREADY_LATEST' }
        }
        const latestResult = comparePieceVersions({ usage, oldMetadata, candidateMetadata: latest })
        const latestAttempt: UpgradeAttempt = { candidate: 'latest', version: latest.version, ...latestResult }
        if (latestResult.compatible) {
            return { outcome: 'upgraded', toVersion: latest.version, candidate: 'latest', attempts: [latestAttempt] }
        }
        // If the latest version is not compatible, check for a compatible version in the same minor range
        const sameMinor = await getMetadata({ version: `~${currentVersion}` })
        if (isNil(sameMinor) || semVer.lte(sameMinor.version, currentVersion)) {
            return { outcome: 'kept', reason: 'NO_COMPATIBLE_VERSION', attempts: [latestAttempt] }
        }
        const sameMinorResult = comparePieceVersions({ usage, oldMetadata, candidateMetadata: sameMinor })
        const sameMinorAttempt: UpgradeAttempt = { candidate: 'same-minor', version: sameMinor.version, ...sameMinorResult }
        if (sameMinorResult.compatible) {
            return { outcome: 'upgraded', toVersion: sameMinor.version, candidate: 'same-minor', attempts: [latestAttempt, sameMinorAttempt] }
        }
        return { outcome: 'kept', reason: 'NO_COMPATIBLE_VERSION', attempts: [latestAttempt, sameMinorAttempt] }
    },
    compare: comparePieceVersions,
}

function comparePieceVersions({ usage, oldMetadata, candidateMetadata }: ComparePieceVersionsParams): CompatibilityResult {
    const oldStep = findStep({ metadata: oldMetadata, usage })
    const candidateStep = findStep({ metadata: candidateMetadata, usage })
    if (isNil(candidateStep)) {
        return failure([{ check: 'STEP_REMOVED', detail: `${usage.kind} ${usage.stepName} does not exist in ${candidateMetadata.version}` }])
    }
    if (isNil(oldStep)) {
        return failure([{ check: 'STEP_NOT_IN_CURRENT_VERSION', detail: `${usage.kind} ${usage.stepName} does not exist in ${oldMetadata.version}` }])
    }
    const failedChecks = [
        ...compareUsedProps({ oldStep, candidateStep, inputKeys: usage.inputKeys }),
        ...compareRequiredProps({ oldStep, candidateStep, inputKeys: usage.inputKeys }),
        ...compareAuth({ oldAuth: oldMetadata.auth, candidateAuth: candidateMetadata.auth }),
        ...compareTriggerStrategy({ usage, oldMetadata, candidateMetadata }),
        ...compareOutputSchema({ oldSchema: oldStep.outputSchema, candidateSchema: candidateStep.outputSchema }),
    ]
    return { compatible: failedChecks.length === 0, failedChecks }
}


function failure(failedChecks: CompatibilityCheckFailure[]): CompatibilityResult {
    return { compatible: false, failedChecks }
}

function findStep({ metadata, usage }: { metadata: PieceVersionMetadata, usage: PieceStepUsage }): ActionBase | TriggerBase | undefined {
    return usage.kind === 'trigger' ? metadata.triggers[usage.stepName] : metadata.actions[usage.stepName]
}

function compareUsedProps({ oldStep, candidateStep, inputKeys }: CompareStepParams): CompatibilityCheckFailure[] {
    return inputKeys.flatMap((key) => {
        const oldProp = oldStep.props[key]
        if (isNil(oldProp)) {
            return []
        }
        const candidateProp = candidateStep.props[key]
        if (isNil(candidateProp)) {
            return [{ check: 'PROP_REMOVED' as const, detail: key }]
        }
        if (oldProp.type !== candidateProp.type) {
            return [{ check: 'PROP_TYPE_CHANGED' as const, detail: `${key}: ${oldProp.type} -> ${candidateProp.type}` }]
        }
        return []
    })
}

function compareRequiredProps({ oldStep, candidateStep, inputKeys }: CompareStepParams): CompatibilityCheckFailure[] {
    return Object.entries(candidateStep.props).flatMap(([key, candidateProp]) => {
        if (!candidateProp.required || !isNil(getDefaultValue(candidateProp)) || inputKeys.includes(key)) {
            return []
        }
        const oldProp = oldStep.props[key]
        const wasAlreadyRequired = !isNil(oldProp) && oldProp.required
        if (wasAlreadyRequired) {
            return []
        }
        return [{ check: 'NEW_REQUIRED_PROP' as const, detail: key }]
    })
}

function getDefaultValue(prop: ActionBase['props'][string]): unknown {
    return 'defaultValue' in prop ? prop.defaultValue : undefined
}

function compareAuth({ oldAuth, candidateAuth }: { oldAuth: PieceAuth, candidateAuth: PieceAuth }): CompatibilityCheckFailure[] {
    const oldSignature = authSignature(oldAuth)
    const candidateSignature = authSignature(candidateAuth)
    if (oldSignature === candidateSignature) {
        return []
    }
    return [{ check: 'AUTH_CHANGED', detail: `${oldSignature || 'none'} -> ${candidateSignature || 'none'}` }]
}

function authSignature(auth: PieceAuth): string {
    if (isNil(auth)) {
        return ''
    }
    const authList = Array.isArray(auth) ? auth : [auth]
    return authList.map((entry) => entry.type).join(',')
}

function compareTriggerStrategy({ usage, oldMetadata, candidateMetadata }: ComparePieceVersionsParams): CompatibilityCheckFailure[] {
    if (usage.kind !== 'trigger') {
        return []
    }
    const oldTrigger = oldMetadata.triggers[usage.stepName]
    const candidateTrigger = candidateMetadata.triggers[usage.stepName]
    if (isNil(oldTrigger) || isNil(candidateTrigger) || oldTrigger.type === candidateTrigger.type) {
        return []
    }
    return [{ check: 'TRIGGER_STRATEGY_CHANGED', detail: `${oldTrigger.type} -> ${candidateTrigger.type}` }]
}

function compareOutputSchema({ oldSchema, candidateSchema }: { oldSchema: OutputSchema | undefined, candidateSchema: OutputSchema | undefined }): CompatibilityCheckFailure[] {
    if (isNil(oldSchema) || isNil(candidateSchema)) {
        return []
    }
    return compareOutputFields({ oldFields: oldSchema.fields, candidateFields: candidateSchema.fields, path: '' })
}

function compareOutputFields({ oldFields, candidateFields, path }: { oldFields: OutputSchemaField[], candidateFields: OutputSchemaField[], path: string }): CompatibilityCheckFailure[] {
    return oldFields.flatMap((oldField) => {
        const fieldPath = path === '' ? oldField.key : `${path}.${oldField.key}`
        const candidateField = candidateFields.find((field) => field.key === oldField.key)
        if (isNil(candidateField)) {
            return [{ check: 'OUTPUT_FIELD_REMOVED' as const, detail: fieldPath }]
        }
        const formatChanges = !isNil(oldField.format) && oldField.format !== candidateField.format
            ? [{ check: 'OUTPUT_FIELD_FORMAT_CHANGED' as const, detail: `${fieldPath}: ${oldField.format} -> ${candidateField.format ?? 'none'}` }]
            : []
        return [
            ...formatChanges,
            ...compareOutputFields({ oldFields: oldField.children ?? [], candidateFields: candidateField.children ?? [], path: fieldPath }),
            ...compareOutputFields({ oldFields: oldField.listItems ?? [], candidateFields: candidateField.listItems ?? [], path: `${fieldPath}[]` }),
        ]
    })
}

type PieceAuth = PieceAuthProperty | PieceAuthProperty[] | undefined

export type PieceVersionMetadata = {
    version: string
    auth?: PieceAuthProperty | PieceAuthProperty[]
    actions: Record<string, ActionBase>
    triggers: Record<string, TriggerBase>
}

export type PieceStepUsage = {
    kind: 'action' | 'trigger'
    stepName: string
    inputKeys: string[]
}

export type CompatibilityCheck =
    | 'STEP_REMOVED'
    | 'STEP_NOT_IN_CURRENT_VERSION'
    | 'PROP_REMOVED'
    | 'PROP_TYPE_CHANGED'
    | 'NEW_REQUIRED_PROP'
    | 'AUTH_CHANGED'
    | 'TRIGGER_STRATEGY_CHANGED'
    | 'OUTPUT_FIELD_REMOVED'
    | 'OUTPUT_FIELD_FORMAT_CHANGED'

export type CompatibilityCheckFailure = {
    check: CompatibilityCheck
    detail: string
}

export type CompatibilityResult = {
    compatible: boolean
    failedChecks: CompatibilityCheckFailure[]
}

export type UpgradeCandidate = 'latest' | 'same-minor'

export type UpgradeAttempt = {
    candidate: UpgradeCandidate
    version: string
    compatible: boolean
    failedChecks: CompatibilityCheckFailure[]
}

export type PieceVersionUpgradeDecision =
    | { outcome: 'upgraded', toVersion: string, candidate: UpgradeCandidate, attempts: UpgradeAttempt[] }
    | { outcome: 'kept', reason: 'NO_COMPATIBLE_VERSION', attempts: UpgradeAttempt[] }
    | { outcome: 'skipped', reason: 'NOT_AN_OFFICIAL_PIECE' | 'ALREADY_LATEST' | 'NON_EXACT_VERSION' }

type ComparePieceVersionsParams = {
    usage: PieceStepUsage
    oldMetadata: PieceVersionMetadata
    candidateMetadata: PieceVersionMetadata
}

type CompareStepParams = {
    oldStep: ActionBase | TriggerBase
    candidateStep: ActionBase | TriggerBase
    inputKeys: string[]
}

type ResolveUpgradeParams = {
    usage: PieceStepUsage
    currentVersion: string
    getMetadata: (params: { version: string | undefined }) => Promise<PieceVersionMetadata | undefined>
}
