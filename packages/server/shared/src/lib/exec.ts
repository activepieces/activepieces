import { exec as execCallback } from 'node:child_process'
import { promisify } from 'node:util'

export const exec = promisify(execCallback)
