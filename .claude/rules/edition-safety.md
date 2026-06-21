Never import from `src/app/ee/` in CE code. CE and EE are separate layers.
To extend CE behavior in EE: use `hooksFactory.create<T>(ceDefault)` in CE, then `.set(eeImpl)` in `app.ts` edition switch.

Rationale: [docs/adr/0002-ee-extends-ce-via-hooks.md](../../docs/adr/0002-ee-extends-ce-via-hooks.md).
