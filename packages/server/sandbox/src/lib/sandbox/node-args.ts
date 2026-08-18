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
        `--max-old-space-size=${engineHeapMb(resourceLimits.memoryLimitMb)}`,
    ]
}

// The engine and the piece child are resident at the same time, so they split one budget
// instead of each claiming all of it — two full allowances under one container limit is a
// kernel-OOM path, which is the failure this whole split exists to avoid.
export function pieceChildHeapMb(memoryLimitMb: number): number {
    return Math.max(MIN_HEAP_MB, Math.floor(memoryLimitMb / 2))
}

export function engineHeapMb(memoryLimitMb: number): number {
    return Math.max(MIN_HEAP_MB, memoryLimitMb - pieceChildHeapMb(memoryLimitMb))
}

const MIN_HEAP_MB = 128
