import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PackageType } from '@activepieces/shared';
import { FastifyBaseLogger } from 'fastify';
import { pieceInstallService } from '../../pieces/piece-install-service';
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service';
import { platformRepo } from '../../platform/platform.service';

/**
 * Synkra Flow bundled pieces boot seed.
 *
 * On every app boot, checks whether our bundled pieces are installed on the
 * default platform. If not, installs them from the .tgz files that ship inside
 * the Docker image. Idempotent. Safe to run on every boot.
 */

type BundledPieceSpec = {
  name: string;
  version: string;
  file: string;
};

const BUNDLED_PIECES: BundledPieceSpec[] = [
  {
    name: '@synkra/piece-synkra-chat',
    version: '0.1.0',
    file: 'synkra-piece-synkra-chat-0.1.0.tgz',
  },
];

/**
 * The asset directory is `packages/server/api/src/assets/synkra-pieces/`.
 * When the app runs from `dist/src/app/synkra/billing/`, we need five `..`
 * to reach `packages/server/api/`. We try both candidates so the seed works
 * whether the app is running compiled or via tsx.
 */
function resolveAssetsDir(): string | null {
  const candidates = [
    // running from dist/src/app/synkra/billing/
    join(__dirname, '..', '..', '..', '..', '..', 'src', 'assets', 'synkra-pieces'),
    // running from src/app/synkra/billing/ (tsx dev)
    join(__dirname, '..', '..', 'assets', 'synkra-pieces'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export const synkraBundledPiecesService = (log: FastifyBaseLogger) => ({
  async installAll(): Promise<void> {
    const assetsDir = resolveAssetsDir();
    if (!assetsDir) {
      log.error('synkra bundled pieces: could not locate assets/synkra-pieces directory');
      return;
    }
    log.info({ assetsDir }, 'synkra bundled pieces: starting install check');

    const platforms = await platformRepo().find({ take: 10 });
    if (platforms.length === 0) {
      log.warn('synkra bundled pieces: no platforms yet, will retry on next boot');
      return;
    }
    for (const platform of platforms) {
      for (const spec of BUNDLED_PIECES) {
        await installOne(platform.id, spec, assetsDir, log);
      }
    }
  },
});

async function installOne(
  platformId: string,
  spec: BundledPieceSpec,
  assetsDir: string,
  log: FastifyBaseLogger,
): Promise<void> {
  try {
    const existing = await pieceMetadataService(log).get({
      name: spec.name,
      version: spec.version,
      platformId: platformId as never,
    });
    if (existing) {
      log.info(
        { piece: spec.name, version: spec.version, platformId },
        'synkra bundled piece already installed',
      );
      return;
    }
  } catch {
    // fall through and try to install
  }

  const filePath = join(assetsDir, spec.file);
  if (!existsSync(filePath)) {
    log.error({ filePath }, 'synkra bundled piece file missing from image');
    return;
  }

  try {
    const buffer = readFileSync(filePath);
    await pieceInstallService(log).installPiece(platformId as never, {
      pieceName: spec.name,
      pieceVersion: spec.version,
      packageType: PackageType.ARCHIVE,
      pieceArchive: {
        data: buffer,
        filename: spec.file,
        mimetype: 'application/gzip',
      },
      scope: 'PLATFORM',
      pieceType: 'CUSTOM',
    } as never);
    log.info(
      { piece: spec.name, version: spec.version, platformId },
      'synkra bundled piece installed',
    );
  } catch (e) {
    log.error(
      { err: e, piece: spec.name, version: spec.version, platformId },
      'synkra bundled piece install failed',
    );
  }
}
