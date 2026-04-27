import { Property, StoreScope } from "@activepieces/pieces-framework"

export enum PieceStoreScope {
    PROJECT = 'COLLECTION',
    FLOW = 'FLOW',
    RUN = 'RUN',
}

export function getScopeAndKey(params: Params): { scope: StoreScope, key: string } {
    switch (params.scope) {
        case PieceStoreScope.PROJECT:
            return { scope: StoreScope.PROJECT, key: params.key }
        case PieceStoreScope.FLOW:
            return { scope: StoreScope.FLOW, key: params.key }
        case PieceStoreScope.RUN:
            // Prefix the key with the run ID so that storage is isolated per run.
            // Using context.run.id (the real flowRunId) keeps all steps in the same
            // test execution — whether triggered by "Test step" or "Generate sample
            // data" — on the same key, so a Put step and a later Get step always
            // share the same run-scoped storage bucket during a single test run.
            return { scope: StoreScope.FLOW, key: `run_${params.runId}/${params.key}` }
    }
}

type Params = {
    runId: string
    key: string
    scope: PieceStoreScope
}

export const common = {
    store_scope: Property.StaticDropdown({
        displayName: 'Store Scope',
        description: 'The storage scope of the value.',
        required: true,
        options: {
            options: [
                {
                    label: 'Project',
                    value: PieceStoreScope.PROJECT,
                },
                {
                    label: 'Flow',
                    value: PieceStoreScope.FLOW,
                },
                {
                    label: 'Run',
                    value: PieceStoreScope.RUN,
                },
            ],
        },
        defaultValue: PieceStoreScope.PROJECT,
    })
}
