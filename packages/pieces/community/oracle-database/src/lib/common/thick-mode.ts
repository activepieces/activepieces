import oracledb from 'oracledb';
import fs from 'fs';
import https from 'https';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';

// Collects log lines emitted during module initialisation so they can be
// flushed into the caller's logs array when _initThickClient runs.
const initLogs: string[] = [];

// /opt/oracle if writable (system/Docker), otherwise ~/.oracle (local dev)
function resolveOracleBaseDir(): string {
  const systemDir = '/opt/oracle';
  try {
    if (!fs.existsSync(systemDir)) {
      initLogs.push(`[oracle] ${systemDir} not found. Creating...`);
      fs.mkdirSync(systemDir, { recursive: true });
      initLogs.push(`[oracle] ${systemDir} created.`);
    } else {
      initLogs.push(`[oracle] ${systemDir} already exists.`);
    }
    fs.accessSync(systemDir, fs.constants.W_OK);
    initLogs.push(`[oracle] Using ${systemDir} as Oracle base dir.`);
    return systemDir;
  } catch (err) {
    const fallback = path.join(os.homedir(), '.oracle');
    initLogs.push(`[oracle] Cannot use ${systemDir} (${(err as Error).message}). Falling back to ${fallback}.`);
    return fallback;
  }
}

const ORACLE_BASE_DIR = resolveOracleBaseDir();
const ORACLE_TEMP_ZIP = path.join(os.tmpdir(), 'oracle-instantclient.zip');
const ORACLE_INSTANT_CLIENT_ARCH = process.arch === 'arm64' ? 'linux.arm64' : 'linux.x64';
const ORACLE_INSTANT_CLIENT_URL =
  `https://download.oracle.com/otn_software/linux/instantclient/2326100/instantclient-basic-${ORACLE_INSTANT_CLIENT_ARCH}-23.26.1.0.0.zip`;
// libaio1 Debian package — update version/hash when needed:
// https://packages.debian.org/bullseye/libaio1
const LIBAIO_DEB_ARCH = process.arch === 'arm64' ? 'arm64' : 'amd64';
const LIBAIO_DEB_URL = `https://ftp.debian.org/debian/pool/main/liba/libaio/libaio1_0.3.112-9_${LIBAIO_DEB_ARCH}.deb`;

// patchelf GitHub release — update version here when needed:
// https://github.com/NixOS/patchelf/releases
const PATCHELF_VERSION = '0.18.0';
const PATCHELF_ARCH = process.arch === 'arm64' ? 'aarch64' : 'x86_64';
const PATCHELF_URL = `https://github.com/NixOS/patchelf/releases/download/${PATCHELF_VERSION}/patchelf-${PATCHELF_VERSION}-${PATCHELF_ARCH}.tar.gz`;
const PATCHELF_BIN = path.join(ORACLE_BASE_DIR, 'bin', 'patchelf');


// Returns the latest valid instantclient_* dir that has libclntsh.so + libnnz.so
function getOracleClientLibDir(): string | null {
  if (!fs.existsSync(ORACLE_BASE_DIR)) return null;
  const dirs = fs
    .readdirSync(ORACLE_BASE_DIR)
    .filter(
      (d) =>
        d.startsWith('instantclient_') &&
        fs.existsSync(`${ORACLE_BASE_DIR}/${d}/libclntsh.so`) &&
        fs.existsSync(`${ORACLE_BASE_DIR}/${d}/libnnz.so`)
    )
    .sort()
    .reverse();
  return dirs.length > 0 ? `${ORACLE_BASE_DIR}/${dirs[0]}` : null;
}

// Downloads a file over HTTPS, following up to 10 redirects
async function downloadFile({ url, dest, logs, redirectDepth = 0 }: { url: string; dest: string; logs: string[]; redirectDepth?: number }): Promise<void> {
  if (redirectDepth > 10) {
    throw new Error(`[oracle] Too many redirects downloading ${url}`);
  }
  return new Promise((resolve, reject) => {
    logs.push(`[oracle] Downloading: ${url}`);
    console.log(`[oracle] Downloading: ${url}`);
    const file = fs.createWriteStream(dest);

    const req = https
      .get(url, (response) => {
        const { statusCode, headers } = response;
        logs.push(`[oracle] HTTP ${statusCode} from ${url}`);
        console.log(`[oracle] HTTP ${statusCode} from ${url}`);

        if ([301, 302, 307, 308].includes(statusCode!)) {
          logs.push(`[oracle] Redirecting to: ${headers.location}`);
          console.log(`[oracle] Redirecting to: ${headers.location}`);
          response.resume();
          file.close();
          fs.unlink(dest, () => {});
          downloadFile({ url: headers.location!, dest, logs, redirectDepth: redirectDepth + 1 }).then(resolve).catch(reject);
          return;
        }

        if (statusCode !== 200) {
          response.resume(); // drain socket so it can be reused
          file.close();
          fs.unlink(dest, () => {});
          reject(new Error(`Download failed: HTTP ${statusCode}`));
          return;
        }

        const totalBytes = parseInt(headers['content-length'] ?? '0', 10);
        let downloadedBytes = 0;
        response.on('data', (chunk: Buffer) => {
          downloadedBytes += chunk.length;
          if (totalBytes > 0) {
            const pct = ((downloadedBytes / totalBytes) * 100).toFixed(1);
            process.stdout.write(`\r[oracle] Downloaded ${pct}%`);
          }
        });

        response.pipe(file);
        file.on('finish', () => {
          logs.push(`[oracle] Download complete: ${dest}`);
          console.log(`\n[oracle] Download complete: ${dest}`);
          file.close(() => resolve());
        });
        file.on('error', (err) => {
          logs.push(`[oracle] Write error: ${err.message}`);
          console.error(`[oracle] Write error:`, err.message);
          file.close();
          fs.unlink(dest, () => {});
          reject(err);
        });
      })
      .on('error', (err) => {
        logs.push(`[oracle] Download error: ${err.message}`);
        console.error(`[oracle] Download error:`, err.message);
        file.close();
        fs.unlink(dest, () => {});
        reject(err);
      });

    // Abort and reject if the server stalls mid-response (e.g. CDN hang)
    req.setTimeout(120_000, () => {
      req.destroy(new Error(`[oracle] Download timed out: ${url}`));
    });
  });
}

/**
 * Returns path to a usable patchelf binary.
 * Uses system patchelf if available, otherwise downloads the binary from
 * GitHub releases to ORACLE_BASE_DIR/bin/patchelf (no root required).
 */
async function ensurePatchelf({ logs }: { logs: string[] }): Promise<string> {
  // Use system patchelf if already installed (e.g. baked into Docker image)
  try {
    logs.push('[oracle] Checking for system patchelf...');
    console.log('[oracle] Checking for system patchelf...');
    execSync('patchelf --version', { stdio: 'pipe' });
    logs.push('[oracle] System patchelf found.');
    return 'patchelf';
  } catch {
    logs.push('[oracle] System patchelf not found.');
    console.log('[oracle] System patchelf not found.');
  }

  // Use previously downloaded binary
  if (fs.existsSync(PATCHELF_BIN)) {
    logs.push(`[oracle] Using cached patchelf at ${PATCHELF_BIN}.`);
    return PATCHELF_BIN;
  }

  logs.push(`[oracle] Downloading patchelf ${PATCHELF_VERSION}...`);
  console.log(`[oracle] Downloading patchelf ${PATCHELF_VERSION}...`);
  const tarPath = path.join(os.tmpdir(), 'patchelf.tar.gz');
  await downloadFile({ url: PATCHELF_URL, dest: tarPath, logs });

  fs.mkdirSync(ORACLE_BASE_DIR, { recursive: true });
  // tarball has ./bin/patchelf; strip './' → extracts bin/patchelf into ORACLE_BASE_DIR
  execSync(`tar -xzf "${tarPath}" -C "${ORACLE_BASE_DIR}" --strip-components=1 ./bin/patchelf`, { stdio: 'pipe' });
  fs.chmodSync(PATCHELF_BIN, 0o755);
  try { fs.unlinkSync(tarPath); } catch { /* ignore */ }

  logs.push(`[oracle] patchelf downloaded to ${PATCHELF_BIN}.`);
  console.log(`[oracle] patchelf downloaded to ${PATCHELF_BIN}`);
  return PATCHELF_BIN;
}

/**
 * Ensures libaio.so.1 is present in libDir — required by Oracle Instant Client.
 * Uses system libaio if available, otherwise downloads the Debian package and
 * extracts libaio.so.1 directly into libDir (no root required).
 * Works together with the RPATH=$ORIGIN patchelf strategy.
 */
async function ensureLibaio({ libDir, logs }: { libDir: string; logs: string[] }): Promise<void> {
  // Already present in the Oracle lib dir (previously extracted)
  if (fs.existsSync(path.join(libDir, 'libaio.so.1'))) {
    logs.push('[oracle] libaio.so.1 already present in lib dir.');
    return;
  }

  // Use system libaio if already installed
  const systemPaths = [
    '/usr/lib/x86_64-linux-gnu/libaio.so.1',
    '/usr/lib/aarch64-linux-gnu/libaio.so.1',
    '/lib/x86_64-linux-gnu/libaio.so.1',
    '/lib/aarch64-linux-gnu/libaio.so.1',
    '/usr/lib64/libaio.so.1',
    '/lib64/libaio.so.1',
  ];
  const systemLib = systemPaths.find((p) => fs.existsSync(p));
  if (systemLib) {
    const realLib = fs.realpathSync(systemLib);
    logs.push(`[oracle] libaio.so.1 found at ${realLib}. Copying into lib dir...`);
    console.log(`[oracle] libaio.so.1 found at ${systemLib}. Symlinking into libDir...`);
    console.log(`[oracle] Copying libaio.so.1 from ${realLib} into libDir...`);
    fs.copyFileSync(realLib, path.join(libDir, 'libaio.so.1'));
    logs.push('[oracle] libaio.so.1 copied from system.');
    return;
  }

  // Download the Debian package and extract libaio.so.1
  logs.push('[oracle] libaio.so.1 not found on system. Downloading Debian package...');
  console.log('[oracle] libaio.so.1 not found. Downloading Debian package...');
  const debPath = path.join(os.tmpdir(), 'libaio1.deb');
  const extractDir = path.join(os.tmpdir(), 'libaio1-extract');

  await downloadFile({ url: LIBAIO_DEB_URL, dest: debPath, logs });

  // .deb is an ar archive — `ar` + `tar` works on all distros (not just Debian/Ubuntu)
  logs.push('[oracle] Extracting libaio1.deb...');
  fs.mkdirSync(extractDir, { recursive: true });
  execSync(`ar x "${debPath}"`, { cwd: extractDir, stdio: 'pipe' });
  const dataFile = fs.readdirSync(extractDir).find((f) => f.startsWith('data.tar'));
  if (!dataFile) throw new Error('[oracle] Could not find data.tar in libaio1 deb');
  execSync(`tar xf "${path.join(extractDir, dataFile)}" --wildcards '*.so*'`, {
    cwd: extractDir,
    stdio: 'pipe',
  });

  const extracted = [
    `${extractDir}/usr/lib/x86_64-linux-gnu/libaio.so.1`,
    `${extractDir}/usr/lib/aarch64-linux-gnu/libaio.so.1`,
    `${extractDir}/lib/x86_64-linux-gnu/libaio.so.1`,
    `${extractDir}/lib/aarch64-linux-gnu/libaio.so.1`,
  ].find((p) => fs.existsSync(p));

  if (!extracted) {
    throw new Error('[oracle] libaio.so.1 not found in downloaded package.');
  }

  fs.copyFileSync(extracted, path.join(libDir, 'libaio.so.1'));
  logs.push('[oracle] libaio.so.1 extracted into Oracle lib dir.');
  console.log('[oracle] libaio.so.1 extracted into Oracle lib dir.');

  try { fs.rmSync(extractDir, { recursive: true }); } catch { /* ignore */ }
  try { fs.unlinkSync(debPath); } catch { /* ignore */ }
}

/**
 * Makes Oracle libs discoverable by the OS dynamic linker.
 *
 * Problem: libDir only tells dlopen where to find libclntsh.so.
 * Its dependencies (libnnz.so etc.) are resolved via LD_LIBRARY_PATH
 * or ldconfig — neither of which is available inside the sandbox.
 *
 * Strategy 1 — patchelf (preferred, no root):
 *   Embeds RPATH=$ORIGIN into libclntsh.so so the linker searches
 *   the library's own directory for dependencies.
 *
 * Strategy 2 — symlinks into /usr/local/lib (fallback, root only):
 *   Works in Docker containers running as root.
 */
async function registerOracleLibs({ libDir, logs }: { libDir: string; logs: string[] }): Promise<void> {
  const libclntsh = `${libDir}/libclntsh.so`;

  try {
    logs.push('[oracle] Acquiring patchelf...');
    const patchelf = await ensurePatchelf({ logs });
    logs.push(`[oracle] Running: patchelf --set-rpath '$ORIGIN' libclntsh.so`);
    execSync(`"${patchelf}" --set-rpath '$ORIGIN' "${libclntsh}"`, { stdio: 'pipe' });
    logs.push('[oracle] RPATH patched successfully.');
    console.log(`[oracle] Patched RPATH of libclntsh.so to $ORIGIN`);
    return;
  } catch (err) {
    logs.push(`[oracle] patchelf strategy failed: ${(err as Error).message}. Trying symlink fallback...`);
    console.log(`[oracle] patchelf strategy failed: ${(err as Error).message}. Trying symlink fallback...`);
  }

  try {
    const libs = fs.readdirSync(libDir).filter((f) => f.endsWith('.so'));
    logs.push(`[oracle] Symlinking ${libs.length} libs into /usr/local/lib and running ldconfig...`);
    for (const lib of libs) {
      execSync(`ln -sf "${libDir}/${lib}" /usr/local/lib/${lib}`, { stdio: 'pipe' });
    }
    execSync('ldconfig', { stdio: 'pipe' });
    logs.push(`[oracle] Registered libs from ${libDir} via /usr/local/lib.`);
    console.log(`[oracle] Registered libs from ${libDir} via /usr/local/lib`);
  } catch {
    logs.push(`[oracle] Could not register libs. Set LD_LIBRARY_PATH=${libDir} before starting the server.`);
    console.log(`[oracle] Could not register libs. Set LD_LIBRARY_PATH=${libDir} before starting the server.`);
  }
}

// Thick mode only — thin mode is oracledb's default, no initOracleClient() call needed.
async function _initThickClient(logs: string[]): Promise<void> {
  // Flush any log lines captured at module load time (resolveOracleBaseDir)
  logs.push(...initLogs);
  initLogs.length = 0;

  let libDir = getOracleClientLibDir();

  if (!libDir) {
    logs.push('[oracle] Instant Client not found locally. Downloading automatically...');
    console.log('[oracle] Instant Client not found. Downloading automatically...');
    await downloadFile({ url: ORACLE_INSTANT_CLIENT_URL, dest: ORACLE_TEMP_ZIP, logs });
    logs.push(`[oracle] Download complete. Extracting to ${ORACLE_BASE_DIR}...`);

    if (!fs.existsSync(ORACLE_BASE_DIR)) {
      fs.mkdirSync(ORACLE_BASE_DIR, { recursive: true });
    }

    execSync(`unzip -o "${ORACLE_TEMP_ZIP}" -d "${ORACLE_BASE_DIR}"`, { stdio: 'pipe' });

    try { fs.unlinkSync(ORACLE_TEMP_ZIP); } catch { /* ignore */ }

    libDir = getOracleClientLibDir();

    if (!libDir) {
      throw new Error(
        'Oracle Instant Client could not be installed automatically. ' +
        'Please install it manually at /opt/oracle/.'
      );
    }
    logs.push(`[oracle] Instant Client extracted to ${libDir}.`);
  } else {
    logs.push(`[oracle] Instant Client already present at ${libDir}.`);
  }

  logs.push('[oracle] Ensuring libaio.so.1 is available...');
  await ensureLibaio({ libDir, logs });
  logs.push('[oracle] libaio.so.1 ready. Registering Oracle libs...');
  await registerOracleLibs({ libDir, logs });
  logs.push('[oracle] Oracle libs registered. Calling initOracleClient...');

  try {
    oracledb.initOracleClient({ libDir });
  } catch (err) {
    const msg = (err as Error).message ?? '';
    // NJS-118: thick mode cannot be enabled because a thin connection was already created.
    // This happens when the same process previously ran a Thin Mode connection (e.g. a prior
    // validation attempt). The process will be recycled automatically — retry in a few minutes.
    if (msg.includes('NJS-118')) {
      throw new Error(
        'Thick Mode cannot be activated because a Thin Mode connection was already established ' +
        'in this process session. This resolves automatically — please try saving the connection again in a few minutes.'
      );
    }
    throw err;
  }

  logs.push(`[oracle] Instant Client loaded from ${libDir}. Thick mode active.`);
  console.log(`[oracle] Instant Client loaded from ${libDir}. Thick mode active.`);
}

/**
 * Ensures Oracle Instant Client is ready and initialises node-oracledb.
 *
 * thickMode = false → thin mode is oracledb's default; no initOracleClient() call is made.
 * thickMode = true  → auto-download Instant Client if missing, patch RPATH,
 *                     then call initOracleClient({ libDir }).
 *
 * Thin mode intentionally skips initOracleClient() — calling it with no args locks the process
 * to whatever system client state it finds and prevents a later thick mode call in the same
 * process (e.g. when a dedicated worker reuses the sandbox across validation attempts).
 *
 * Promise-based singleton for thick mode — concurrent callers all await the same Promise
 * so initOracleClient is never called twice (prevents NJS-090).
 */
export const ensureOracleClient: (params: { thickMode: boolean; logs: string[] }) => Promise<void> = (() => {
  let thickInitPromise: Promise<void> | null = null;
  return ({ thickMode, logs }: { thickMode: boolean; logs: string[] }): Promise<void> => {
    if (!thickMode) {
      logs.push('[oracle] Thin mode selected; skipping Instant Client setup.');
      return Promise.resolve();
    }
    // Already in thick mode (initOracleClient was called successfully earlier)
    if (!oracledb.thin) {
      logs.push('[oracle] Thick mode already active (Instant Client previously loaded).');
      return Promise.resolve();
    }
    if (!thickInitPromise) {
      // Clear on failure so the next call can retry (e.g. transient network error)
      thickInitPromise = _initThickClient(logs).catch((err) => {
        thickInitPromise = null;
        throw err;
      });
    } else {
      logs.push('[oracle] Thick mode initialisation already in progress; waiting...');
    }
    return thickInitPromise;
  };
})();
