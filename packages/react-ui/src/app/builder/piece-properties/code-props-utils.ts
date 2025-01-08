
import { CodeProperty, CodePropertyMap, PieceMetadataModel, PiecePropertyMap } from "@activepieces/pieces-framework";
import { isEmpty, isNil } from "@activepieces/shared";
import { Value } from '@sinclair/typebox/value'

const removeNonFormProps = (obj: object): any => {
    const objectCopy: Record<string, unknown> = { ...obj };
    Object.keys(objectCopy).forEach((key) => {
      if (
        typeof objectCopy[key] !== 'object' ||
        isNil(objectCopy[key]) ||
        Array.isArray(objectCopy[key])
      ) {
        delete objectCopy[key];
      }
      
      if (!Value.Check(CodeProperty,objectCopy[key])) {
        delete objectCopy[key];
      }
    });
    return objectCopy as CodePropertyMap;
  };
  
  const extractPropsFromCode = (code: string) => {

    const propsFinderRegex =  /props:\s*({[\s\S]*?}(?=,|\s*\w|$))/;
    const match = code.match(propsFinderRegex);
    if (match) {
      try {
        const rawProps = Function(`return ${match[1]}`)();
        console.log(rawProps)
        if (typeof rawProps !== 'object' || isEmpty(rawProps)) return null;
        const props = removeNonFormProps(rawProps);
        return props as CodePropertyMap;
      } catch (error) {
        console.error(error);
        return null;
      }
    }
    return null;
  };
  
  const convertCodePropertyMapToPiecePropertyMap = (
    props: CodePropertyMap,
    piecesModels: Record<string, PieceMetadataModel | undefined>,
  ) => {
    return Object.keys(props).reduce((acc, key) => {
      if (props[key].type === 'AUTH') {
        const piece = piecesModels[props[key].pieceName];
        if (piece && piece.auth) {
          acc[key] = piece.auth;
        }
      } else {
        acc[key] = props[key];
      }
      return acc;
    }, {} as PiecePropertyMap);
  };
  const extractPiecesNameFromCodeProps = (props: CodePropertyMap) => {
    return Object.values(props).reduce((acc, value) => {
      if (value.type === 'AUTH') {
        acc.push(value.pieceName);
      }
      return acc;
    }, [] as string[]);
  };




export const codePropsUtils = {
  extractPropsFromCode,
  convertCodePropertyMapToPiecePropertyMap,
  extractPiecesNameFromCodeProps,
};
