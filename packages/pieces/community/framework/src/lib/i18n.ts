import { I18nForPiece, PieceMetadataModel, PieceMetadataModelSummary } from "./piece-metadata"
import { LocalesEnum } from "@activepieces/shared"
import path from 'path';
import fs from 'fs/promises';
import keys from '../../translation-keys.json'

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



const extractPiecePath = async (pieceName: string) => {
  try{
   if(await fileExists(`/node_modules/${pieceName}`)) {
    return `/node_modules/${pieceName}`;
   }
   console.log(`/node_modules/${pieceName} does not exist`)
    
    const distPath = path.resolve('dist/packages/pieces');
    const fastGlob = (await import('fast-glob')).default;
    const packageJsonFiles = await fastGlob('**/**/package.json', { cwd: distPath });
    for (const relativeFile of packageJsonFiles) {
      const fullPath = path.join(distPath, relativeFile);
      try {
        const packageJson = JSON.parse(await fs.readFile(fullPath, 'utf-8'));
        if (packageJson.name === pieceName) {
          const piecePath = path.dirname(fullPath);
          return piecePath;
        }
      } catch (err) {
        console.log(`Error reading package.json at ${fullPath}:`, err);
      }
    }
  }
  catch (err) {
    console.log(`Error extracting piece path for ${pieceName}:`, err)
  }
  console.log(`Piece path not found for ${pieceName}`);
  return undefined;
}



const translatePiece = <T extends PieceMetadataModelSummary | PieceMetadataModel>(piece: T, locale?: LocalesEnum): T => {
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
}
/**Gets the piece metadata regardles of piece location (node_modules or dist), wasn't included inside piece.metadata() for backwards compatibility issues (if an old ap version installs a new piece it would fail)*/
const initializeI18n =  async (pieceName: string): Promise<I18nForPiece | undefined> => {
  try{
    const locales = Object.values(LocalesEnum);
    const i18n: I18nForPiece = {};
    const pieceOutputPath = await extractPiecePath(pieceName)
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
  catch (err) {
    console.log(`Error initializing i18n for ${pieceName}:`, err)
    return undefined
  }
}

export const pieceTranslation = {
  translatePiece,
  initializeI18n
}
