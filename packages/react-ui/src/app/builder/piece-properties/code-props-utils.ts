
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
  
  const extractPropsFromCode = (codeString: string) => {

     // Find the start and end of props object
     const startIndex = codeString.indexOf('props:');
     if (startIndex === -1) {return null;}
 
     let braceCount = 0;
     let foundStart = false;
     let propsString = '';
     
     // Iterate through the string character by character
     for (let i = startIndex + 5; i < codeString.length; i++) {
         const char = codeString[i];
         
         if (char === '{' && !foundStart) {
             foundStart = true;
         }
         
         if (foundStart) {
             propsString += char;
             if (char === '{') {braceCount++;}
             if (char === '}') {braceCount--;}
             
             // When we've found the matching closing brace, we're done
             if (braceCount === 0) break;
         }
     }
     try {
         // Use Function constructor instead of eval for better scoping
         const rawProps = (new Function('return ' + propsString))();
         if (typeof rawProps !== 'object' || isEmpty(rawProps)) return null;
         const props = removeNonFormProps(rawProps);
         return props as CodePropertyMap;
     } catch (error) {
         console.error('Failed to parse props:', error);
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
