import { enablePieceTrigger } from './hooks/enable-trigger-hook'
import { disablePieceTrigger } from './hooks/disable-trigger-hook'
import { tryHandshake } from './hooks/handshake-trigger.hook'
import { executeTrigger } from './hooks/execute-trigger-hooks'

export const triggerHooks = {
    tryHandshake,
    executeTrigger,
    enable: enablePieceTrigger,
    disable: disablePieceTrigger,
}

