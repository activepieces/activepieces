import { promisify } from 'node:util'
import { exec as execCallback } from 'node:child_process'

export const exec = promisify(execCallback)
