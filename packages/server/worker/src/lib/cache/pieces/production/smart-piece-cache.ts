import { assertNotEqual, isEmpty, PackageType, PiecePackage, PieceType } from "@activepieces/shared"
import { FastifyBaseLogger } from "fastify"
import { workerRedisConnections } from "../../../utils/worker-redis"
import { apDayjsDuration, fileSystemUtils } from "@activepieces/server-shared"
import { join } from "node:path"
import writeFileAtomic from 'write-file-atomic'
import { getArchive } from "../../../utils/flow-engine-util"
import { executionFiles } from "../../execution-files"

const USED_PIECES_REDIS_KEY = 'used-piece'
const usedPiecesMemoryCache : Record<string, boolean> = {}
const usedPiecesRedisCache = (piece: PiecePackage) => `${USED_PIECES_REDIS_KEY}:${piece.pieceName}:${piece.pieceVersion}:${piece.pieceType}:${piece.packageType}:${piece.packageType === PackageType.ARCHIVE ? `${piece.archiveId}` : 'NULL'}`
const piecePath = (projectPath: string, piece: PiecePackage) => join(projectPath, 'pieces', `${piece.pieceName}-${piece.pieceVersion}`)

export const smartPieceCache = (log: FastifyBaseLogger) => ({

    async filterCachedPieces(projectPath: string, pieces: PiecePackage[]): Promise<PiecePackage[]> {
        const filterResults = await Promise.all(pieces.map(piece => checkIfPieceIsCached(piecePath(projectPath, piece))))
        return pieces.filter((_, idx) => !filterResults[idx])
    },

    async markPiecesAsCached(projectPath: string, pieces: PiecePackage[], skipRedisWrite: boolean = false) {
        const redis = await workerRedisConnections.useExisting()
        const expireDuration = apDayjsDuration(30, "days").asSeconds()
        const piecesRedisKeys = 
            skipRedisWrite 
            ? Array(pieces.length).fill(null)
            : await redis.mget(pieces.map(usedPiecesRedisCache))

        await Promise.all(pieces.map(async (piece, idx) => {
            await markPieceAsInstalledInMemAndDisk(piecePath(projectPath, piece))
            if (!skipRedisWrite && !piecesRedisKeys[idx]) {
              await redis.set(usedPiecesRedisCache(piece), 'true', 'EX', expireDuration)
            }
        }))
    },

    async preWarmCache(token: string): Promise<void> { 
        const pieces = await getCachedPiecesInRedis(token)
        if (isEmpty(pieces)) {
            return
        }
        const customPiecesPath = await executionFiles(log).getCustomPiecesPath({ platformId: "placeholder" })
        await executionFiles(log).installRegistryPieces(pieces, customPiecesPath)
    }

})

async function checkIfPieceIsCached(pieceFolder: string): Promise<boolean> {
  if (usedPiecesMemoryCache[pieceFolder]) {
      return true
  }
  usedPiecesMemoryCache[pieceFolder] = await fileSystemUtils.fileExists(join(pieceFolder, 'ready'))
  return usedPiecesMemoryCache[pieceFolder]
}

async function markPieceAsInstalledInMemAndDisk(pieceFolder: string): Promise<void> {
  const expireDuration = apDayjsDuration(10, "days").asMilliseconds()
  const readyFilePath = join(pieceFolder, 'ready')
  await writeFileAtomic(readyFilePath, 'true', 'utf8')
  usedPiecesMemoryCache[pieceFolder] = true

  setTimeout(async () => {
    delete usedPiecesMemoryCache[pieceFolder]
  }, expireDuration)
}

async function getCachedPiecesInRedis(token: string): Promise<PiecePackage[]> {
  const redis = await workerRedisConnections.useExisting()
  const piecesKeys = await redis.keys(`${USED_PIECES_REDIS_KEY}:*`)
  return Promise.all(piecesKeys.map(async (key) => {
      const [_, pieceName, pieceVersion, pieceType, packageType, archiveId] = key.split(':')
      if (packageType === PackageType.REGISTRY) {
          return {
              pieceName,
              pieceVersion,
              pieceType: pieceType as PieceType,
              packageType: PackageType.REGISTRY,
          }
      }
      assertNotEqual(archiveId, 'NULL', 'archiveId', 'NULL')
      const archive = await getArchive(token, archiveId)
      return {
          pieceName,
          pieceVersion,
          pieceType: pieceType as PieceType,
          packageType: PackageType.ARCHIVE,
          archiveId: archiveId!,
          archive,
      }
  }))
}