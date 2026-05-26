import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { sandboxCapacity } from '../../src/lib/sandbox/capacity'
import { iptablesLockdown, IptablesLockdown } from '../../src/lib/egress/iptables-lockdown'
import { requireLinuxPrivileged } from './helpers/privilege-guard'
import { silentLogger } from './helpers/silent-logger'
import { EchoServer, startTcpEcho } from './helpers/test-server'

const execFileAsync = promisify(execFile)

const SANDBOX_UID = sandboxCapacity.firstBoxUid
const SANDBOX_GID = sandboxCapacity.firstBoxUid
const CHAIN = 'AP_EGRESS_LOCKDOWN'
const ALLOWED_NAMESERVER = '127.0.0.1'
const BLOCKED_NAMESERVER = '8.8.8.8'

const skip = requireLinuxPrivileged()

describe.skipIf(skip)('iptables-lockdown — real kernel rules', () => {
    let proxyEcho: EchoServer
    let rpcEcho: EchoServer
    let blockedEcho: EchoServer
    let lockdown: IptablesLockdown | null = null

    beforeAll(async () => {
        proxyEcho = await startTcpEcho()
        rpcEcho = await startTcpEcho()
        blockedEcho = await startTcpEcho()
    })

    afterAll(async () => {
        await proxyEcho?.close()
        await rpcEcho?.close()
        await blockedEcho?.close()
    })

    beforeEach(async () => {
        lockdown = await iptablesLockdown.apply({
            log: silentLogger(),
            proxyPort: proxyEcho.port,
            wsRpcPortRange: { first: rpcEcho.port, last: rpcEcho.port },
            firstBoxUid: SANDBOX_UID,
            numBoxes: 1,
            nameservers: [ALLOWED_NAMESERVER],
        })
    })

    afterEach(async () => {
        if (lockdown) {
            await lockdown.remove()
            lockdown = null
        }
    })

    it('installs the AP_EGRESS_LOCKDOWN chain in the OUTPUT flow', async () => {
        const { stdout } = await execFileAsync('iptables', ['-S', CHAIN])
        expect(stdout).toContain(`-A ${CHAIN} -o lo -p tcp -m tcp --dport ${proxyEcho.port} -j ACCEPT`)
        // iptables renders single-port ranges as either "N" or "N:N" depending on version.
        expect(stdout).toMatch(new RegExp(`-A ${CHAIN} -o lo -p tcp -m tcp --dport ${rpcEcho.port}(:${rpcEcho.port})? -j ACCEPT`))
        expect(stdout).toContain(`-A ${CHAIN} -j REJECT --reject-with icmp-host-prohibited`)

        const { stdout: outputChain } = await execFileAsync('iptables', ['-S', 'OUTPUT'])
        // iptables collapses a single-UID range to a bare UID on display.
        expect(outputChain).toMatch(new RegExp(`--uid-owner ${SANDBOX_UID}(-${SANDBOX_UID})?\\b`))
        expect(outputChain).toContain(`-j ${CHAIN}`)
    })

    it('allows the sandbox UID to reach the proxy port', async () => {
        const result = await probeConnect({ port: proxyEcho.port, uid: SANDBOX_UID, gid: SANDBOX_GID })
        expect(result.status).toBe('OK')
    })

    it('allows the sandbox UID to reach WS RPC ports', async () => {
        const result = await probeConnect({ port: rpcEcho.port, uid: SANDBOX_UID, gid: SANDBOX_GID })
        expect(result.status).toBe('OK')
    })

    it('rejects the sandbox UID from reaching any other loopback port', async () => {
        const result = await probeConnect({ port: blockedEcho.port, uid: SANDBOX_UID, gid: SANDBOX_GID })
        expect(result.status).toBe('ERR')
        if (result.status === 'ERR') {
            expect(result.code).toMatch(/EHOSTUNREACH|ENETUNREACH|ECONNREFUSED|EACCES|EPERM/)
        }
    })

    it('does NOT affect processes outside the sandbox UID range', async () => {
        const result = await probeConnect({ port: blockedEcho.port, uid: undefined, gid: undefined })
        expect(result.status).toBe('OK')
    })

    it('installs DNS nameserver allow rules for UDP and TCP /53', async () => {
        const { stdout } = await execFileAsync('iptables', ['-S', CHAIN])
        expect(stdout).toMatch(new RegExp(`-A ${CHAIN} -d ${ALLOWED_NAMESERVER}(/32)? -p udp -m udp --dport 53 -j ACCEPT`))
        expect(stdout).toMatch(new RegExp(`-A ${CHAIN} -d ${ALLOWED_NAMESERVER}(/32)? -p tcp -m tcp --dport 53 -j ACCEPT`))
    })

    it('rejects the sandbox UID from sending UDP /53 to a non-allowlisted nameserver', async () => {
        const result = await probeUdp({ host: BLOCKED_NAMESERVER, port: 53, uid: SANDBOX_UID, gid: SANDBOX_GID })
        expect(result.status).toBe('ERR')
        if (result.status === 'ERR') {
            expect(result.code).toMatch(/EHOSTUNREACH|ENETUNREACH|EPERM|EACCES/)
        }
    })

    it('removes the chain cleanly so a subsequent lookup returns nothing', async () => {
        await lockdown!.remove()
        lockdown = null
        await expect(execFileAsync('iptables', ['-S', CHAIN])).rejects.toThrow()
    })
})

async function probeConnect({ port, uid, gid }: {
    port: number
    uid: number | undefined
    gid: number | undefined
}): Promise<ProbeResult> {
    const script = `const net = require('node:net');
const s = net.createConnection({ port: ${port}, host: '127.0.0.1' });
s.setTimeout(2000);
s.on('connect', () => { process.stdout.write('OK'); s.destroy(); process.exit(0); });
s.on('timeout', () => { process.stdout.write('TIMEOUT'); process.exit(2); });
s.on('error', (e) => { process.stdout.write('ERR:' + (e.code || e.message)); process.exit(1); });`
    return new Promise((resolve) => {
        const child = spawn(process.execPath, ['-e', script], {
            uid,
            gid,
            stdio: ['ignore', 'pipe', 'pipe'],
        })
        const chunks: Buffer[] = []
        child.stdout.on('data', (d: Buffer) => chunks.push(d))
        child.on('close', () => {
            const out = Buffer.concat(chunks).toString()
            if (out === 'OK') {
                resolve({ status: 'OK' })
                return
            }
            if (out.startsWith('ERR:')) {
                resolve({ status: 'ERR', code: out.slice(4) })
                return
            }
            resolve({ status: 'ERR', code: out || 'EMPTY' })
        })
    })
}

async function probeUdp({ host, port, uid, gid }: {
    host: string
    port: number
    uid: number | undefined
    gid: number | undefined
}): Promise<ProbeResult> {
    const script = `const dgram = require('node:dgram');
const s = dgram.createSocket('udp4');
let settled = false;
const done = (out) => { if (settled) return; settled = true; process.stdout.write(out); s.close(); process.exit(0); };
s.on('error', (e) => done('ERR:' + (e.code || e.message)));
s.send(Buffer.from([0]), ${port}, '${host}', (err) => { if (err) done('ERR:' + (err.code || err.message)); });
setTimeout(() => done('OK'), 500);`
    return new Promise((resolve) => {
        const child = spawn(process.execPath, ['-e', script], {
            uid,
            gid,
            stdio: ['ignore', 'pipe', 'pipe'],
        })
        const chunks: Buffer[] = []
        child.stdout.on('data', (d: Buffer) => chunks.push(d))
        child.on('close', () => {
            const out = Buffer.concat(chunks).toString()
            if (out === 'OK') {
                resolve({ status: 'OK' })
                return
            }
            if (out.startsWith('ERR:')) {
                resolve({ status: 'ERR', code: out.slice(4) })
                return
            }
            resolve({ status: 'ERR', code: out || 'EMPTY' })
        })
    })
}

type ProbeResult = { status: 'OK' } | { status: 'ERR', code: string }
