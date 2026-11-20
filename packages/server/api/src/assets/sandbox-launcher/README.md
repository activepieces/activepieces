# ap-sandbox-launcher

A minimal setuid-free launcher that the isolate box runs instead of `node` directly
(SRE-342 workstream C). It sets `PR_SET_NO_NEW_PRIVS`, installs a seccomp filter, then
`execvp`s the program passed as its arguments (node + the engine).

The filter:

- allows `socket()` only for `AF_UNIX`, `AF_INET`, `AF_INET6` (every other family → `EPERM`),
- denies `keyctl`, `add_key`, `request_key`, `unshare`, `setns`, `mount`, `bpf`,
  `userfaultfd`, `ptrace`, `process_vm_readv`, `process_vm_writev`, `kexec_load`,
  `init_module`, `finit_module`, and the `io_uring` calls,
- returns `EPERM` for denied calls rather than killing the process, so a library that
  probes for a feature degrades instead of crashing.

## Build

```
make            # produces ./ap-sandbox-launcher (static, x64 or arm64 per host)
```

Build-only dependency: `libseccomp-dev` (the binary is statically linked, so no runtime
shared library is needed). The Docker image builds it per-arch and installs it to
`/usr/local/bin/ap-sandbox-launcher`; nothing is committed prebuilt.
