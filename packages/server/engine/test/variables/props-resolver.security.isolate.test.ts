process.env.AP_EXECUTION_MODE = 'SANDBOX_CODE_ONLY'

import { runSecuritySuite } from './props-resolver.security.shared'

runSecuritySuite('SANDBOX_CODE_ONLY')
