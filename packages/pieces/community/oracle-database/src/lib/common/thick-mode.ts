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
const ORACLE_INSTANT_CLIENT_URL =
  'https://download.oracle.com/otn_software/linux/instantclient/2326100/instantclient-basic-linux.x64-23.26.1.0.0.zip';

// Ensures initOracleClient is called at most once per process (NJS-077 guard)
let oracleClientInitialized = false;

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

// Downloads a file over HTTPS, following redirects
async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`[oracle] Downloading: ${url}`);
    const file = fs.createWriteStream(dest);

    https
      .get(url, (response) => {
        const { statusCode, headers } = response;
        console.log(`[oracle] HTTP ${statusCode} from ${url}`);

        if ([301, 302, 307, 308].includes(statusCode!)) {
          console.log(`[oracle] Redirecting to: ${headers.location}`);
          file.close();
          fs.unlink(dest, () => {});
          downloadFile(headers.location!, dest).then(resolve).catch(reject);
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
function registerOracleLibs(libDir: string): void {
  const libclntsh = `${libDir}/libclntsh.so`;

  try {
    execSync(`patchelf --set-rpath '$ORIGIN' "${libclntsh}"`, { stdio: 'pipe' });
    console.log(`[oracle] Patched RPATH of libclntsh.so to $ORIGIN`);
    return;
  } catch {
    // patchelf not available — try symlink fallback
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

/**
 * Ensures Oracle Instant Client is ready and initialises node-oracledb.
 *
 * thickMode = false → try system client (initOracleClient with no args),
 *                     silently stay in Thin mode if none found.
 * thickMode = true  → auto-download client if missing, patch RPATH,
 *                     then initOracleClient({ libDir }).
 */
export async function ensureOracleClient(thickMode: boolean): Promise<void> {
  if (!thickMode) {
    if (!oracleClientInitialized) {
      try {
        oracledb.initOracleClient();
        oracleClientInitialized = true;
        console.log('[oracle] System Oracle Client loaded. Thin mode active.');
      } catch {
        // No system client — staying in Thin mode
      }
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

  if (!oracleClientInitialized) {
    registerOracleLibs(libDir);
    oracledb.initOracleClient({ libDir });
    oracleClientInitialized = true;
    console.log(`[oracle] Instant Client loaded from ${libDir}. Thick mode active.`);
  }
}
