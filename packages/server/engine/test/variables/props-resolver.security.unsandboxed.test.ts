process.env.AP_EXECUTION_MODE = 'UNSANDBOXED'

import { runSecuritySuite } from './props-resolver.security.shared'

runSecuritySuite('UNSANDBOXED')
