import { disablePieceTrigger } from './hooks/disable-trigger-hook'
import { enablePieceTrigger } from './hooks/enable-trigger-hook'
import { tryHandshake } from './hooks/handshake-trigger.hook'

export const triggerHooks = {
    tryHandshake,
    enable: enablePieceTrigger,
    disable: disablePieceTrigger,
}
