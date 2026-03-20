import path from 'path'
import dotenv from 'dotenv'

const resolvedPath = path.resolve(__dirname, '.env.tests')
dotenv.config({ path: resolvedPath })
console.log('Configuring vitest ' + resolvedPath)
