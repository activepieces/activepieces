import { SandboxResourceLimits } from './types'

// Every engine child needs these, in every execution mode. isolate caps nothing itself (we pass
// no --mem, no --cg-mem), so --max-old-space-size is the ONLY thing bounding engine memory —
// without it the engine ran with V8's default heap, outgrew its container, and was SIGKILLed by
// the kernel OOM killer with no diagnostics (isolate reports only "Caught fatal signal 9").
// --expose-gc is equally load-bearing: the engine's periodic forced GC in worker-socket.ts is
// silently a no-op when global.gc is undefined.
export function engineNodeArgs(resourceLimits: SandboxResourceLimits): string[] {
    return [
        // IMPORTANT DO NOT REMOVE THIS ARGUMENT: https://github.com/laverdet/isolated-vm/issues/424
        '--no-node-snapshot',
        '--expose-gc',
        `--max-old-space-size=${resourceLimits.memoryLimitMb}`,
    ]
}
