import { ApEdition } from '../flag/flag'

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
