import { ApEdition } from '../flag/flag'

// Only Cloud may attach end-user PII (email/name) to the shared analytics project;
// self-hosted editions (ce/ee) send non-PII telemetry only. Centralised here so
// every telemetry call site gates PII identically and cannot drift apart.
export const pickTelemetryPii = ({
    edition,
    email,
    firstName,
    lastName,
}: PickTelemetryPiiParams): TelemetryPii => {
    if (edition !== ApEdition.CLOUD) {
        return {}
    }
    return { email, firstName, lastName }
}

type PickTelemetryPiiParams = {
    edition: ApEdition
    email: string
    firstName: string
    lastName: string
}

type TelemetryPii =
    | { email: string, firstName: string, lastName: string }
    | Record<string, never>
