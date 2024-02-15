import { enablePieceTrigger } from './hooks/enable-trigger-hook'
import { disablePieceTrigger } from './hooks/disable-trigger-hook'
import { tryHandshake } from './hooks/handshake-trigger.hook'
import { executeTrigger } from './hooks/execute-trigger-hooks'
import { renewWebhook } from './hooks/renew-trigger-hook'

export const triggerHooks = {
    tryHandshake,
    executeTrigger,
    renewWebhook,
    enable: enablePieceTrigger,
    disable: disablePieceTrigger,
}
