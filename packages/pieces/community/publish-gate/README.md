# pieces-publish-gate

Stops a flow before its next steps unless the flow has been published, so test
and draft runs never trigger the real actions placed below the gate.

## Building

Run `turbo run build --filter=@activepieces/piece-publish-gate` to build the library.
