import { Trigger } from './trigger/trigger';
import { Action } from './action/action';
import {
  EventPayload,
  ParseEventResponse,
  PieceCategory,
} from '@activepieces/shared';
import { PieceBase, PieceMetadata} from './piece-metadata';
import { PieceAuthProperty } from './property/authentication';
import { ServerContext } from './context';
import path from 'path';
import fs from 'fs/promises';

export class Piece<PieceAuth extends PieceAuthProperty = PieceAuthProperty>
  implements Omit<PieceBase, 'version' | 'name'>
{
  private readonly _actions: Record<string, Action> = {};
  private readonly _triggers: Record<string, Trigger> = {};

  constructor(
    public readonly displayName: string,
    public readonly logoUrl: string,
    public readonly authors: string[],
    public readonly events: PieceEventProcessors | undefined,
    actions: Action<PieceAuth>[],
    triggers: Trigger<PieceAuth>[],
    public readonly categories: PieceCategory[],
    public readonly auth?: PieceAuth,
    public readonly minimumSupportedRelease?: string,
    public readonly maximumSupportedRelease?: string,
    public readonly description = '',
  ) {
    actions.forEach((action) => (this._actions[action.name] = action));
    triggers.forEach((trigger) => (this._triggers[trigger.name] = trigger));
  }


  metadata(): BackwardCompatiblePieceMetadata {
    return {
      displayName: this.displayName,
      logoUrl: this.logoUrl,
      actions: this._actions,
      triggers: this._triggers,
      categories: this.categories,
      description: this.description,
      authors: this.authors,
      auth: this.auth,
      minimumSupportedRelease: this.minimumSupportedRelease,
      maximumSupportedRelease: this.maximumSupportedRelease
    };
  }

  getAction(actionName: string): Action | undefined {
    return this._actions[actionName];
  }

  getTrigger(triggerName: string): Trigger | undefined {
    return this._triggers[triggerName];
  }

  actions() {
    return this._actions;
  }

  triggers() {
    return this._triggers;
  }
}

export const createPiece = <PieceAuth extends PieceAuthProperty>(
  params: CreatePieceParams<PieceAuth>
) => {
  return new Piece(
    params.displayName,
    params.logoUrl,
    params.authors ?? [],
    params.events,
    params.actions,
    params.triggers,
    params.categories ?? [],
    params.auth ?? undefined,
    params.minimumSupportedRelease,
    params.maximumSupportedRelease,
    params.description,
  );
};

type CreatePieceParams<
  PieceAuth extends PieceAuthProperty = PieceAuthProperty
> = {
  displayName: string;
  logoUrl: string;
  authors: string[];
  description?: string;
  auth: PieceAuth | undefined;
  events?: PieceEventProcessors;
  minimumSupportedRelease?: string;
  maximumSupportedRelease?: string;
  actions: Action<PieceAuth>[];
  triggers: Trigger<PieceAuth>[];
  categories?: PieceCategory[];
};

type PieceEventProcessors = {
  parseAndReply: (ctx: { payload: EventPayload, server: Omit<ServerContext, 'token' | 'apiUrl'> }) => ParseEventResponse;
  verify: (ctx: {
    webhookSecret: string | Record<string, string>;
    payload: EventPayload;
    appWebhookUrl: string;
  }) => boolean;
};

type BackwardCompatiblePieceMetadata = Omit<PieceMetadata, 'name' | 'version' | 'authors' | 'i18n'> & {
  authors?: PieceMetadata['authors']
  i18n?: PieceMetadata['i18n']
}


const folderExists = async (filePath: string): Promise<boolean> => {
  try {
      await fs.access(filePath)
      return true
  }
  catch {
      return false
  }
}

export async function getPiecePath({ packageName, pieceSource }: { packageName: string, pieceSource: string }): Promise<string> {
  const rootDir = path.parse(__dirname).root
  if (pieceSource === 'FILE') {
    const distPath = path.resolve('dist/packages/pieces');
    const groupDirs = await fs.readdir(distPath, { withFileTypes: true });
    for (const group of groupDirs) {
      if (!group.isDirectory()) continue;
      const groupPath = path.join(distPath, group.name);
      const pieceDirs = await fs.readdir(groupPath, { withFileTypes: true });
      for (const pieceFolder of pieceDirs) {
        if (!pieceFolder.isDirectory()) continue;
        const pkgPath = path.join(groupPath, pieceFolder.name, 'package.json');
        try {
          const packageJson = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
          if (packageJson.name === packageName) {
            return path.join(groupPath, pieceFolder.name);
          }
        } catch {
          // ignore non-package folders
        }
      }
    }
    throw new Error(`Piece path not found for ${packageName}`)
  }
  // this code works because engine gets bundled with the framework in it, so we can use __dirname to get the path to the pieces folder
  let currentDir = __dirname
  const maxIterations = currentDir.split(path.sep).length
  for (let i = 0; i < maxIterations; i++) {
      const piecePath = path.resolve(currentDir, 'pieces', packageName, 'node_modules', packageName)
      if (await folderExists(piecePath)) {
          return piecePath
      }
      const parentDir = path.dirname(currentDir)
      if (parentDir === currentDir || currentDir === rootDir) {
          break
      }
      currentDir = parentDir
  }
  throw new Error(`Piece path not found for package: ${packageName}`)
}