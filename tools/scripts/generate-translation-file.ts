import { argv } from 'node:process'
import chalk from 'chalk';
import { generateMetadata } from './update-pieces-metadata/generate-metadata'

import { getAvailablePieceNames } from './utils/get-available-piece-names'
import { readPackageJson, readProjectJson } from './utils/files'
import { PieceMetadata } from '../../packages/pieces/framework/src';
import { extractPieceFromModule } from './update-pieces-metadata/generate-metadata';
import { validateMetadata } from './update-pieces-metadata/validate-metadata';
import * as fs from 'fs';

async function getPiecesData() {
  const pieces: PieceMetadata[] = [];

  const piecePackageNames = await getAvailablePieceNames();

//   for (const packageName of piecePackageNames) {
    //   if (packageName != 'google-calendar' && packageName != 'google-drive') {
        //   const packagePath = `packages/pieces/${packageName}`;
          const packagePath = `packages/pieces/kizeo-forms`;

          const packageJson = await readPackageJson(packagePath);
          console.log(packageJson)
          const module = await import(`../../${packagePath}/src/index.ts`);
          const { name: pieceName, version: pieceVersion } = packageJson;

          const piece = extractPieceFromModule({
              module,
              pieceName,
              pieceVersion
          });
          const metadata = {
              ...piece.metadata(),
              name: piece.name,
              version: piece.version
          };
          const actions: Record<string, any> = {};
          for (const action of Object.values(metadata.actions)) {
              const props: Record<string, any> = {};
              console.log(action.props)
              for (const [key, prop] of Object.entries(action.props)) {

                let propData: Record<string, any> = {
                    "displayName": prop.displayName
                };
                if (prop.description) {
                    propData["description"] = prop.description;
                }
                props[key] = propData;

              }
              actions[action.name] = {
                  "displayName": action.displayName,
                  "description": action.description,
                  "props": props
              }
          }
          const triggers: Record<string, any> = {};
          for (const trigger of Object.values(metadata.triggers)) {
              const props: Record<string, any> = {};
              for (const [key, prop] of Object.entries(trigger.props)) {

                let propData: Record<string, any> = {
                    "displayName": prop.displayName
                };
                if (prop.description) {
                    propData["description"] = prop.description;
                }
                props[key] = propData;

              }
              triggers[trigger.name] = {
                  "displayName": trigger.displayName,
                  "description": trigger.description,
                  "props": props
              }
          }

          const data = {
              [pieceName]: {
                  "actions": actions,
                  "triggers": triggers
              }
          };
    console.log(JSON.stringify(data))
    const jsonStr = JSON.stringify(data, null, 2);
    fs.writeFileSync('data.json', jsonStr, 'utf8');

        //   validateMetadata(metadata);
        //   console.log(metadata.actions['get_all_list_items'].props)
        //   console.log(metadata)
        //   pieces.push(metadata);
    //   }
//   }
}


const main = async () => {
  const [, , langage] = argv

getPiecesData()
//   const piecesMetadata = await generateMetadata()





//   const pieces = await getAvailablePieceNames()

//   console.log()
  console.log(chalk.green('✨  Done!', langage));
  console.log(chalk.yellow(`ca march bien bravo`));
}

main()
