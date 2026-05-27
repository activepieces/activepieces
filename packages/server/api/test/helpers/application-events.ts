import { ApplicationEventName } from '@activepieces/shared'

export function actionsEmitted(spy: ReturnType<typeof vi.fn>): ApplicationEventName[] {
    return spy.mock.calls.map((call) => (call[1] as { action: ApplicationEventName }).action)
}
