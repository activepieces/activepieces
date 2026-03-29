Never import from `src/app/ee/` in CE code. CE and EE are separate layers.
To extend CE behavior in EE: use `hooksFactory.create<T>(ceDefault)` in CE, then `.set(eeImpl)` in `app.ts` edition switch.
