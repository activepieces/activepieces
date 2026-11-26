import { SandboxResourceLimits } from './types'

// Every engine child needs these, in every execution mode. isolate caps nothing itself (we pass
// no --mem, no --cg-mem), so --max-old-space-size is the ONLY thing bounding engine memory —
// without it the engine ran with V8's default heap, outgrew its container, and was SIGKILLed by
// the kernel OOM killer with no diagnostics (isolate reports only "Caught fatal signal 9").
// The engine's periodic full GC comes from the heap-profile read in piece-memory-sampler.ts;
// --expose-gc keeps the global.gc fallback working when the sampler could not start.
export function engineNodeArgs(resourceLimits: SandboxResourceLimits): string[] {
    return [
        // IMPORTANT DO NOT REMOVE THIS ARGUMENT: https://github.com/laverdet/isolated-vm/issues/424
        '--no-node-snapshot',
        '--expose-gc',
        `--max-old-space-size=${resourceLimits.memoryLimitMb}`,
    ]
}
