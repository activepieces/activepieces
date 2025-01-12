
import { CodeProperty, CodePropertyMap, PieceMetadataModel, PiecePropertyMap } from "@activepieces/pieces-framework";
import { isEmpty, isNil } from "@activepieces/shared";
import { Value } from '@sinclair/typebox/value'
import { CodeOnlyPropertyType } from "@activepieces/pieces-framework";

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
  

  const extractPropsStringFromCode = (codeString: string) => {
    const codeConstStringMatch = codeString.match(/\bconst\s+code\s*=\s*\{/g);
    if (isNil(codeConstStringMatch)) {return null;}
    const position = codeString.indexOf(codeConstStringMatch[0]);
    const codeStringAfterCodeConst = codeString.slice(position + codeConstStringMatch[0].length-1);
    const propsStringStartIndex = codeStringAfterCodeConst.indexOf('props:');
    if (propsStringStartIndex === -1) {return null;}
    return codeStringAfterCodeConst.slice(propsStringStartIndex + 'props:'.length);
  }
  const ensureStringIsJsJson = (propsString: string) => {
     let braceCount = 0;
     let foundStart = false;
     let foundEnd = false;
     const jsJsonString = propsString.split('').reduce((result,char)=>{
      if (char === '{' && !foundStart) {
          foundStart = true;
      }
      if (foundStart && !foundEnd) {
          result += char;
          if (char === '{') {braceCount++;}
          if (char === '}') {braceCount--;}
          foundEnd = braceCount === 0;
      }
      return result;
     },'');
     if(!foundEnd)
     {
      return null;
     }
     return jsJsonString;
  }
  const extractPropsFromCode = (codeString: string) => {

    const codePropsString = extractPropsStringFromCode(codeString);
    if (isNil(codePropsString)) {return null;}
    const propsValueString = ensureStringIsJsJson(codePropsString);
    if (isNil(propsValueString)) {return null;}
     try {
      
         // Use Function constructor instead of eval for better scoping
         const rawProps = (new Function('return ' + propsValueString))();
         if (typeof rawProps !== 'object' || isEmpty(rawProps)) return null;
         const props = removeNonFormProps(rawProps);
         return props as CodePropertyMap;
     } catch (error) {
         console.error(`Failed to parse ${codePropsString}`, error);
         return null;
     }

  };
  
  const convertCodePropertyMapToPiecePropertyMap = (
    props: CodePropertyMap,
    piecesModels: Record<string, PieceMetadataModel | undefined>,
  ) => {
    return Object.keys(props).reduce((acc, key) => {
      if (props[key].type === CodeOnlyPropertyType.AUTH) {
        const piece = piecesModels[props[key].pieceName];
        if (piece && piece.auth) {
          acc[key] = {...piece.auth, displayName: props[key].displayName};
        }
      } else {
        acc[key] = props[key];
      }
      return acc;
    }, {} as PiecePropertyMap);
  };
  const extractPiecesNameFromCodeProps = (props: CodePropertyMap) => {
    return Object.values(props).reduce((acc, value) => {
      if (value.type === CodeOnlyPropertyType.AUTH) {
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
