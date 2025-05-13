import { I18nForPiece, PieceMetadata, PieceMetadataModel, PieceMetadataModelSummary } from "./piece-metadata"
import { LocalesEnum } from "@activepieces/shared"
import path from 'path';
import fs from 'fs/promises';

function getPropertyValue(object: Record<string, unknown>, path: string): unknown {
  const parsedKeys = path.split('.');
  if (parsedKeys[0] === '*') {
    return Object.values(object).map(item => getPropertyValue(item as Record<string, unknown>, parsedKeys.slice(1).join('.'))).filter(Boolean).flat()
  }
  const nextObject = object[parsedKeys[0]] as Record<string, unknown>;
  if (nextObject && parsedKeys.length > 1) {
    return getPropertyValue(nextObject, parsedKeys.slice(1).join('.'));
  }
  return nextObject;
}

function translateProperty(object: Record<string, unknown>, path: string, i18n: Record<string, string>) {
  const parsedKeys = path.split('.');
  if (parsedKeys[0] === '*') {
    return Object.values(object).forEach(item => translateProperty(item as Record<string, unknown>, parsedKeys.slice(1).join('.'), i18n))
  }
  const nextObject = object[parsedKeys[0]] as Record<string, unknown>;
  if (!nextObject) {
    return;
  }
  if (parsedKeys.length > 1) {
    return translateProperty(nextObject, parsedKeys.slice(1).join('.'), i18n);
  }
  const valueInI18n = i18n[object[parsedKeys[0]] as string]
  if (valueInI18n) {
    object[parsedKeys[0]] = valueInI18n
  }
}

const keys: string[] = [
  'displayName', 'description',
  'auth.username.displayName',
  'auth.username.description',
  'auth.password.displayName',
  'auth.password.description',
  'auth.props.*.displayName',
  'auth.props.*.description',
  'auth.props.*.options.options.*.label',
  'auth.description',
  'actions.*.displayName',
  'actions.*.description',
  'actions.*.props.*.displayName',
  'actions.*.props.*.description',
  'actions.*.props.*.options.options.*.label',
  'triggers.*.displayName',
  'triggers.*.description',
  'triggers.*.props.*.displayName',
  'triggers.*.props.*.description',
  'triggers.*.props.*.options.options.*.label'
];

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

const readLocaleFile = async (locale: LocalesEnum, pieceOutputPath: string) => {
  const filePath = path.join(pieceOutputPath, 'src', 'i18n', `${locale}.json`);

  if (!(await fileExists(filePath))) {
    return null;
  }

  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const translations = JSON.parse(fileContent);

    if (typeof translations === 'object' && translations !== null) {
      console.log(`Translation loaded for ${locale} in piece ${pieceOutputPath}`);
      return translations;
    }
    throw new Error(`Invalid i18n file format for ${locale} in piece ${pieceOutputPath}`);
  } catch (error) {
    console.error(`Error reading i18n file for ${locale} in piece ${pieceOutputPath}:`, error);
    return null;
  }
}

const extractPiecePath = async (pieceName: string, pieceSource: 'node_modules' | 'dist') => {
  if (pieceSource === 'node_modules') {
    return path.resolve('node_modules', pieceName);
  }

  const distPath = path.resolve('dist/packages/pieces');
  const fastGlob = (await import('fast-glob')).default;
  const packageJsonFiles = await fastGlob('**/**/package.json', { cwd: distPath });

  for (const relativeFile of packageJsonFiles) {
    const fullPath = path.join(distPath, relativeFile);
    try {
      const packageJson = JSON.parse(await fs.readFile(fullPath, 'utf-8'));
      if (packageJson.name === pieceName) {
        const piecePath = path.dirname(fullPath);
        console.log(`Found piece path: ${piecePath}`);
        return piecePath;
      }
    } catch (err) {
      console.error(`Error reading package.json at ${fullPath}:`, err);
    }
  }

  return undefined;
}

export const pieceTranslation = {
  generateTranslationFile: (piece: PieceMetadata) => {
    const translation: Record<string, string> = {}
    try {
      keys.forEach(key => {
        const value = getPropertyValue(piece, key)
        if (value) {
          if (typeof value === 'string') {
            translation[value] = value
          }
          else if (Array.isArray(value)) {
            value.forEach(item => {
              translation[item] = item
            })
          }
        }
      })
    }
    catch (err) {
      console.error(`error generating translation file for piece ${piece.name}:`, err)
    }

    return translation
  },

  translatePiece: <T extends PieceMetadataModelSummary | PieceMetadataModel>(piece: T, locale?: LocalesEnum): T => {
    if (!locale) {
      return piece
    }
    try {
      const target = piece.i18n?.[locale]
      if (!target) {
        return piece
      }
      const translatedPiece: T = JSON.parse(JSON.stringify(piece))
      keys.forEach(key => {
        translateProperty(translatedPiece, key, target)
      })
      return translatedPiece
    }
    catch (err) {
      console.error(`error translating piece ${piece.name}:`, err)
      return piece
    }
  },

  initializeI18n: async (pieceName: string, pieceSource: 'node_modules' | 'dist'): Promise<I18nForPiece | undefined> => {
    const locales = Object.values(LocalesEnum);
    const i18n: I18nForPiece = {};
    const pieceOutputPath = await extractPiecePath(pieceName, pieceSource)
    if (!pieceOutputPath) {
      return undefined
    }
    for (const locale of locales) {
      const translation = await readLocaleFile(locale, pieceOutputPath);
      if (translation) {
        i18n[locale] = translation;
      }
    }
    return (Object.keys(i18n).length > 0) ? i18n : undefined;
  }
};
