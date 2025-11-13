import { isEmpty, PackageType, PiecePackage, PieceType } from "@activepieces/shared"
import { FastifyBaseLogger } from "fastify"
import { workerRedisConnections } from "../../../utils/worker-redis"
import { apDayjsDuration, fileSystemUtils } from "@activepieces/server-shared"
import { GLOBAL_CACHE_COMMON_PATH } from "../../worker-cache"
import { registryPieceManager } from "./registry-piece-manager"
import { join } from "node:path"
import writeFileAtomic from 'write-file-atomic'

const USED_PIECES_REDIS_KEY = 'used-piece'
const usedPiecesMemoryCache : Record<string, boolean> = {}
const usedPiecesRedisCache = (piece: PiecePackage) => `${USED_PIECES_REDIS_KEY}:${piece.pieceName}:${piece.pieceVersion}:${piece.packageType}`
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
            await markPieceAsInstalledInMemAndDisk(piecePath(projectPath, piece), expireDuration)
            if (!piecesRedisKeys[idx]) {
              await redis.set(usedPiecesRedisCache(piece), 'true', 'EX', expireDuration)
            }
        }))
    },

    async preWarmCache(): Promise<void> { 
        const pieces = await getCachedPiecesInRedis()
        if (isEmpty(pieces)) {
            return
        }
        await registryPieceManager(log).install({
            projectPath: GLOBAL_CACHE_COMMON_PATH,
            pieces,
            skipRedisWrite: true,
        })
    }

})

async function checkIfPieceIsCached(pieceFolder: string): Promise<boolean> {
  if (usedPiecesMemoryCache[pieceFolder]) {
      return true
  }
  usedPiecesMemoryCache[pieceFolder] = await fileSystemUtils.fileExists(join(pieceFolder, 'ready'))
  return usedPiecesMemoryCache[pieceFolder]
}

async function markPieceAsInstalledInMemAndDisk(pieceFolder: string, expireDuration: number): Promise<void> {
  const readyFilePath = join(pieceFolder, 'ready')
  await writeFileAtomic(readyFilePath, 'true', 'utf8')
  usedPiecesMemoryCache[pieceFolder] = true

  setTimeout(async () => {
    delete usedPiecesMemoryCache[pieceFolder]
    await fileSystemUtils.deleteFile(readyFilePath)
  }, expireDuration * 1000)
}

async function getCachedPiecesInRedis(): Promise<PiecePackage[]> {
  const redis = await workerRedisConnections.useExisting()
  const piecesKeys = await redis.keys(`${USED_PIECES_REDIS_KEY}:*`)
  return piecesKeys.map((key) => {
      const [_, pieceName, pieceVersion, packageType] = key.split(':')
      if (packageType === PackageType.REGISTRY) {
          return {
              pieceName,
              pieceVersion,
              pieceType: PieceType.OFFICIAL,
              packageType: PackageType.REGISTRY,
          }
      }
      return {
          pieceName,
          pieceVersion,
          pieceType: PieceType.CUSTOM,
          packageType: PackageType.ARCHIVE,
          archiveId: '',
          archive: null,
      }
  })
}