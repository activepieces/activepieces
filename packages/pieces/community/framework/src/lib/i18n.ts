import { I18nForPiece, PieceMetadataModel, PieceMetadataModelSummary } from "./piece-metadata"
import { LocalesEnum, MAX_KEY_LENGTH_FOR_CORWDIN } from "@activepieces/shared"
import path from 'path';
import fs from 'fs/promises';

export const pieceTranslation = {
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
      pieceTranslation.pathsToValuesToTranslate.forEach(key => {
        translateProperty(translatedPiece, key, target)
      })
      return translatedPiece
    }
    catch (err) {
      console.error(`error translating piece ${piece.name}:`, err)
      return piece
    }
  },

  /**Gets the piece metadata regardles of piece location (node_modules or dist), wasn't included inside piece.metadata() for backwards compatibility issues (if an old ap version installs a new piece it would fail)*/
  initializeI18n: async (pieceOutputPath: string): Promise<I18nForPiece | undefined> => {
    try {
      const locales = Object.values(LocalesEnum);
      const i18n: I18nForPiece = {};
      
      for (const locale of locales) {
        const translations = await readLocaleFile(locale, pieceOutputPath);
        if (translations) {
          i18n[locale] = translations;
        }
      }
      
      return Object.keys(i18n).length > 0 ? i18n : undefined;
    }
    catch (err) {
      console.log(`Error initializing i18n for ${pieceOutputPath}:`, err)
      return undefined
    }
  },

  pathsToValuesToTranslate: [
    "description",
    "auth.username.displayName",
    "auth.username.description",
    "auth.password.displayName",
    "auth.password.description",
    "auth.props.*.displayName",
    "auth.props.*.description",
    "auth.props.*.options.options.*.label",
    "auth.description",
    "actions.*.displayName",
    "actions.*.description",
    "actions.*.props.*.displayName",
    "actions.*.props.*.description",
    "actions.*.props.*.options.options.*.label",
    "triggers.*.displayName",
    "triggers.*.description",
    "triggers.*.props.*.displayName",
    "triggers.*.props.*.description",
    "triggers.*.props.*.options.options.*.label"
  ]
}


/**This function translates a property inside a piece, i.e description, displayName, etc... 
 * 
 * @param pieceModelOrProperty - The piece model or property to translate
 * @param path - The path to the property to translate, i.e auth.username.displayName
 * @param i18n - The i18n object
 */
function translateProperty(pieceModelOrProperty: Record<string, unknown>, path: string, i18n: Record<string, string>) {
  const parsedKeys = path.split('.');
  if (parsedKeys[0] === '*') {
    return Object.values(pieceModelOrProperty).forEach(item => translateProperty(item as Record<string, unknown>, parsedKeys.slice(1).join('.'), i18n))
  }
  const nextObject = pieceModelOrProperty[parsedKeys[0]] as Record<string, unknown>;
  if (!nextObject) {
    return;
  }
  if (parsedKeys.length > 1) {
    return translateProperty(nextObject, parsedKeys.slice(1).join('.'), i18n);
  }
  const propertyValue = pieceModelOrProperty[parsedKeys[0]] as string
  const valueInI18n = i18n[propertyValue.slice(0, MAX_KEY_LENGTH_FOR_CORWDIN)]
  if (valueInI18n) {
    pieceModelOrProperty[parsedKeys[0]] = valueInI18n
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
    console.log(`readLocaleFile: ${filePath} does not exist`)
    return null;
  }

  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const translations = JSON.parse(fileContent);
    if (typeof translations === 'object' && translations !== null) {
      return translations;
    }
    throw new Error(`Invalid i18n file format for ${locale} in piece ${pieceOutputPath}`);
  } catch (error) {
    console.error(`Error reading i18n file for ${locale} in piece ${pieceOutputPath}:`, error);
    return null;
  }
}
