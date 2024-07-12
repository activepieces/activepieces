import { disablePieceTrigger } from './hooks/disable-trigger-hook'
import { enablePieceTrigger } from './hooks/enable-trigger-hook'

export const triggerHooks = {
    enable: enablePieceTrigger,
    disable: disablePieceTrigger,
}
