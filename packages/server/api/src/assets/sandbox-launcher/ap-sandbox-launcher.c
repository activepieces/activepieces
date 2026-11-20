#define _GNU_SOURCE
#include <errno.h>
#include <stddef.h>
#include <stdio.h>
#include <sys/prctl.h>
#include <sys/socket.h>
#include <unistd.h>

#include <seccomp.h>

static const int DENIED_SYSCALLS[] = {
    SCMP_SYS(keyctl),
    SCMP_SYS(add_key),
    SCMP_SYS(request_key),
    SCMP_SYS(unshare),
    SCMP_SYS(setns),
    SCMP_SYS(mount),
    SCMP_SYS(bpf),
    SCMP_SYS(userfaultfd),
    SCMP_SYS(ptrace),
    SCMP_SYS(process_vm_readv),
    SCMP_SYS(process_vm_writev),
    SCMP_SYS(kexec_load),
    SCMP_SYS(init_module),
    SCMP_SYS(finit_module),
    SCMP_SYS(io_uring_setup),
    SCMP_SYS(io_uring_enter),
    SCMP_SYS(io_uring_register),
};

static int install_filter(void)
{
    scmp_filter_ctx ctx = seccomp_init(SCMP_ACT_ALLOW);
    if (ctx == NULL) {
        return -1;
    }

    for (size_t i = 0; i < sizeof(DENIED_SYSCALLS) / sizeof(DENIED_SYSCALLS[0]); i++) {
        if (seccomp_rule_add(ctx, SCMP_ACT_ERRNO(EPERM), DENIED_SYSCALLS[i], 0) != 0) {
            seccomp_release(ctx);
            return -1;
        }
    }

    if (seccomp_rule_add(ctx, SCMP_ACT_ERRNO(EPERM), SCMP_SYS(socket), 1,
            SCMP_A0(SCMP_CMP_EQ, (scmp_datum_t)AF_UNSPEC)) != 0
        || seccomp_rule_add(ctx, SCMP_ACT_ERRNO(EPERM), SCMP_SYS(socket), 2,
            SCMP_A0(SCMP_CMP_GE, (scmp_datum_t)3), SCMP_A0(SCMP_CMP_LE, (scmp_datum_t)9)) != 0
        || seccomp_rule_add(ctx, SCMP_ACT_ERRNO(EPERM), SCMP_SYS(socket), 1,
            SCMP_A0(SCMP_CMP_GE, (scmp_datum_t)11)) != 0) {
        seccomp_release(ctx);
        return -1;
    }

    if (seccomp_load(ctx) != 0) {
        seccomp_release(ctx);
        return -1;
    }
    seccomp_release(ctx);
    return 0;
}

int main(int argc, char **argv)
{
    if (argc < 2) {
        fprintf(stderr, "ap-sandbox-launcher: usage: ap-sandbox-launcher <program> [args...]\n");
        return 127;
    }

    if (prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0) != 0) {
        perror("ap-sandbox-launcher: prctl(PR_SET_NO_NEW_PRIVS)");
        return 126;
    }

    if (install_filter() != 0) {
        fprintf(stderr, "ap-sandbox-launcher: failed to install seccomp filter\n");
        return 126;
    }

    execvp(argv[1], &argv[1]);
    perror("ap-sandbox-launcher: execvp");
    return 127;
}
