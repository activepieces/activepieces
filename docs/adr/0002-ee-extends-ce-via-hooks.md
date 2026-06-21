# Enterprise extends Community through hooks, not imports

Community Edition (CE) and Enterprise Edition (EE) are separate layers: CE code must never import from `src/app/ee/`. To let EE change CE behaviour, CE defines an extension point with `hooksFactory.create<T>(ceDefault)` and EE supplies the implementation with `.set(eeImpl)` in the `app.ts` edition switch. This keeps the open-source CE build free of licensed EE code and lets a single codebase ship three editions (`ce`/`ee`/`cloud`) selected by `AP_EDITION`; see `.claude/rules/edition-safety.md`.
