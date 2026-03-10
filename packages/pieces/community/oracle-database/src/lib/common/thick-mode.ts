import oracledb from 'oracledb';
import fs from 'fs';
import https from 'https';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';

// /opt/oracle if writable (system/Docker), otherwise ~/.oracle (local dev)
function resolveOracleBaseDir(): string {
  const systemDir = '/opt/oracle';
  try {
    fs.accessSync(systemDir, fs.constants.W_OK);
    return systemDir;
  } catch {
    return path.join(os.homedir(), '.oracle');
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
async function downloadFile(url: string, dest: string, redirectDepth = 0): Promise<void> {
  if (redirectDepth > 10) {
    throw new Error(`[oracle] Too many redirects downloading ${url}`);
  }
  return new Promise((resolve, reject) => {
    console.log(`[oracle] Downloading: ${url}`);
    const file = fs.createWriteStream(dest);

    https
      .get(url, (response) => {
        const { statusCode, headers } = response;
        console.log(`[oracle] HTTP ${statusCode} from ${url}`);

        if ([301, 302, 307, 308].includes(statusCode!)) {
          console.log(`[oracle] Redirecting to: ${headers.location}`);
          response.resume();
          file.close();
          fs.unlink(dest, () => {});
          downloadFile(headers.location!, dest, redirectDepth + 1).then(resolve).catch(reject);
          return;
        }

        if (statusCode !== 200) {
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
          console.log(`\n[oracle] Download complete: ${dest}`);
          file.close(() => resolve());
        });
      })
      .on('error', (err) => {
        console.error(`[oracle] Download error:`, err.message);
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

/**
 * Returns path to a usable patchelf binary.
 * Uses system patchelf if available, otherwise downloads the binary from
 * GitHub releases to ORACLE_BASE_DIR/bin/patchelf (no root required).
 */
async function ensurePatchelf(): Promise<string> {
  // Use system patchelf if already installed (e.g. baked into Docker image)
  try {
    console.log('[oracle] Checking for system patchelf...');
    execSync('patchelf --version', { stdio: 'pipe' });
    return 'patchelf';
  } catch {
    console.log('[oracle] System patchelf not found.');
  }

  // Use previously downloaded binary
  if (fs.existsSync(PATCHELF_BIN)) return PATCHELF_BIN;

  console.log(`[oracle] Downloading patchelf ${PATCHELF_VERSION}...`);
  const tarPath = path.join(os.tmpdir(), 'patchelf.tar.gz');
  await downloadFile(PATCHELF_URL, tarPath);

  fs.mkdirSync(ORACLE_BASE_DIR, { recursive: true });
  // tarball has ./bin/patchelf; strip './' → extracts bin/patchelf into ORACLE_BASE_DIR
  execSync(`tar -xzf "${tarPath}" -C "${ORACLE_BASE_DIR}" --strip-components=1 ./bin/patchelf`, { stdio: 'pipe' });
  fs.chmodSync(PATCHELF_BIN, 0o755);
  try { fs.unlinkSync(tarPath); } catch { /* ignore */ }

  console.log(`[oracle] patchelf downloaded to ${PATCHELF_BIN}`);
  return PATCHELF_BIN;
}

/**
 * Ensures libaio.so.1 is present in libDir — required by Oracle Instant Client.
 * Uses system libaio if available, otherwise downloads the Debian package and
 * extracts libaio.so.1 directly into libDir (no root required).
 * Works together with the RPATH=$ORIGIN patchelf strategy.
 */
async function ensureLibaio(libDir: string): Promise<void> {
  // Already present in the Oracle lib dir (previously extracted)
  if (fs.existsSync(path.join(libDir, 'libaio.so.1'))) return;

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
    console.log(`[oracle] libaio.so.1 found at ${systemLib}. Symlinking into libDir...`);
    const realLib = fs.realpathSync(systemLib);
    console.log(`[oracle] Copying libaio.so.1 from ${realLib} into libDir...`);
    fs.copyFileSync(realLib, path.join(libDir, 'libaio.so.1'));
    return;
  }

  // Download the Debian package and extract libaio.so.1 (no root needed)
  console.log('[oracle] libaio.so.1 not found. Downloading Debian package...');
  const debPath = path.join(os.tmpdir(), 'libaio1.deb');
  const extractDir = path.join(os.tmpdir(), 'libaio1-extract');

  await downloadFile(LIBAIO_DEB_URL, debPath);

  // .deb is an ar archive — `ar` + `tar` works on all distros (not just Debian/Ubuntu)
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
async function registerOracleLibs(libDir: string): Promise<void> {
  const libclntsh = `${libDir}/libclntsh.so`;

  try {
    const patchelf = await ensurePatchelf();
    execSync(`"${patchelf}" --set-rpath '$ORIGIN' "${libclntsh}"`, { stdio: 'pipe' });
    console.log(`[oracle] Patched RPATH of libclntsh.so to $ORIGIN`);
    return;
  } catch (err) {
    console.log(`[oracle] patchelf strategy failed: ${(err as Error).message}. Trying symlink fallback...`);
  }

  try {
    const libs = fs.readdirSync(libDir).filter((f) => f.endsWith('.so'));
    for (const lib of libs) {
      execSync(`ln -sf "${libDir}/${lib}" /usr/local/lib/${lib}`, { stdio: 'pipe' });
    }
    execSync('ldconfig', { stdio: 'pipe' });
    console.log(`[oracle] Registered libs from ${libDir} via /usr/local/lib`);
  } catch {
    console.log(`[oracle] Could not register libs. Set LD_LIBRARY_PATH=${libDir} before starting the server.`);
  }
}

async function _initOracleClient(thickMode: boolean): Promise<void> {
  if (!thickMode) {
    try {
      oracledb.initOracleClient();
      console.log('[oracle] System Oracle Client loaded. Thin mode active.');
    } catch {
      // No system client — staying in Thin mode
    }
    return;
  }

  let libDir = getOracleClientLibDir();

  if (!libDir) {
    console.log('[oracle] Instant Client not found. Downloading automatically...');
    await downloadFile(ORACLE_INSTANT_CLIENT_URL, ORACLE_TEMP_ZIP);

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
  }

  await ensureLibaio(libDir);
  await registerOracleLibs(libDir);
  oracledb.initOracleClient({ libDir });
  console.log(`[oracle] Instant Client loaded from ${libDir}. Thick mode active.`);
}

/**
 * Ensures Oracle Instant Client is ready and initialises node-oracledb.
 *
 * thickMode = false → try system client (initOracleClient with no args),
 *                     silently stay in Thin mode if none found.
 * thickMode = true  → auto-download client if missing, patch RPATH,
 *                     then initOracleClient({ libDir }).
 *
 * Promise-based singleton — concurrent callers all await the same Promise
 * so initOracleClient is never called twice (prevents NJS-077).
 */
export const ensureOracleClient: (thickMode: boolean) => Promise<void> = (() => {
  let initPromise: Promise<void> | null = null;
  return (thickMode: boolean): Promise<void> => {
    if (!initPromise) {
      initPromise = _initOracleClient(thickMode);
    }
    return initPromise;
  };
})();
