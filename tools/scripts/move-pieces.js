const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define the root folder path
const rootFolderPath = '/workspace/packages/pieces';

// Function to read project.json file and extract name attribute
function readProjectJson(folderPath) {
    const projectJsonPath = path.join(folderPath, 'project.json');
    const projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
    const packageName = projectJson.name;
    return packageName;
}

// Function to list packages/pieces in each folder
function listPackagesInFolders(folderPath) {
    const folders = fs.readdirSync(folderPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && dirent.name !== 'community' && dirent.name !== 'custom')
        .map(dirent => dirent.name);

    const packages = folders.map(folder => {
        const packagePath = path.join(folderPath, folder);
        const packageName = readProjectJson(packagePath);

        return { folder, packageName };
    });

    // Execute nx g move command
   packages.forEach(({ folder, packageName }) => {
        const destination = 'packages/pieces/community/' + folder;

        const command = `nx g move --projectName=${packageName} --newProjectName=${packageName} --destination=${destination} --importPath=@activepieces/piece-${folder}`;
        try{
            execSync(command, { stdio: 'inherit' });
        }catch(err){
            console.log(err);
        }
    })

    return packages;
}

// Call the function with the root folder path
const packagesInFolders = listPackagesInFolders(rootFolderPath);
console.log(packagesInFolders);