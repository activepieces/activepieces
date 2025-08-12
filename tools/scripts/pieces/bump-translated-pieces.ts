import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface PackageJson {
  name: string;
  version: string;
  [key: string]: any;
}

interface UpdateResult {
  success: boolean;
  oldVersion?: string;
  newVersion?: string;
  error?: string;
}

// Function to bump patch version
function bumpPatchVersion(version: string): string {
  const parts = version.split('.');
  if (parts.length >= 3) {
    const patch = parseInt(parts[2]) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }
  return version;
}

// Function to update package.json
function updatePackageJson(packageJsonPath: string): UpdateResult {
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson: PackageJson = JSON.parse(content);
    
    if (packageJson.version) {
      const oldVersion = packageJson.version;
      const newVersion = bumpPatchVersion(oldVersion);
      
      console.log(`Bumping ${path.basename(path.dirname(packageJsonPath))}: ${oldVersion} -> ${newVersion}`);
      
      packageJson.version = newVersion;
      
      // Write back to file with proper formatting
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      
      return { success: true, oldVersion, newVersion };
    }
    
    return { success: false, error: 'No version field found in package.json' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error updating ${packageJsonPath}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

// Function to check if a piece has changes compared to main
function hasChangesComparedToMain(piecePath: string): boolean {
  try {
    // Check if there are any changes in the piece directory compared to main
    execSync(`git diff --quiet origin/main -- ${piecePath}`, { encoding: 'utf8' });
    return false; // No changes
  } catch (error) {
    if (error instanceof Error && 'status' in error && error.status === 1) {
      return true; // Has changes
    }
    throw error;
  }
}

// Function to check if a piece has i18n directory
function hasI18nDirectory(piecePath: string): boolean {
  const i18nPath = path.join(piecePath, 'src', 'i18n');
  return fs.existsSync(i18nPath) && fs.statSync(i18nPath).isDirectory();
}

// Function to check if a piece has translation-related changes
function hasTranslationChanges(piecePath: string): boolean {
  try {
    // Check if there are changes in the i18n directory
    const i18nChanges = execSync(`git diff --name-only origin/main -- ${piecePath}/src/i18n`, { encoding: 'utf8' }).trim();
    return i18nChanges.length > 0;
  } catch (error) {
    if (error instanceof Error && 'status' in error && error.status === 1) {
      return true; // Has changes
    }
    return false; // No changes or error
  }
}

// Function to check if a piece version has already been bumped compared to main
function hasVersionBeenBumped(piecePath: string): boolean {
  try {
    const packageJsonPath = path.join(piecePath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return false;
    }

    // Get current version
    const content = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson: PackageJson = JSON.parse(content);
    const currentVersion = packageJson.version;

    if (!currentVersion) {
      return false;
    }

    // Get version from main branch
    const mainVersion = execSync(`git show origin/main:${packageJsonPath}`, { encoding: 'utf8' });
    const mainPackageJson: PackageJson = JSON.parse(mainVersion);
    const mainBranchVersion = mainPackageJson.version;

    // Compare versions - if current version is higher than main, it's already been bumped
    return compareVersions(currentVersion, mainBranchVersion) > 0;
  } catch (error) {
    // If we can't get the main version (e.g., file doesn't exist on main), assume not bumped
    return false;
  }
}

// Helper function to compare semantic versions
function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }
  
  return 0;
}

// Function to get all piece directories
function getPieceDirectories(piecesDir: string): string[] {
  return fs.readdirSync(piecesDir)
    .filter(item => {
      const fullPath = path.join(piecesDir, item);
      return fs.statSync(fullPath).isDirectory();
    });
}

// Main function
function main(): void {
  console.log('Finding pieces with translation changes compared to main...');
  
  const piecesWithChanges: string[] = [];
  const piecesDir = 'packages/pieces/community';
  
  // Get all piece directories
  const pieceDirs = getPieceDirectories(piecesDir);
  
  console.log(`Checking ${pieceDirs.length} pieces for changes...`);
  
  for (const piece of pieceDirs) {
    const piecePath = path.join(piecesDir, piece);
    // Check if piece has changes compared to main
    if (hasChangesComparedToMain(piecePath)) {
      // Check if it has i18n directory (indicating translations were added)
      if (hasI18nDirectory(piecePath)) {
        // Check if the changes are translation-related
        if (hasTranslationChanges(piecePath)) {
          // Check if version has already been bumped
          if (hasVersionBeenBumped(piecePath)) {
            console.log(`  - ${piece} - has translation changes but version already bumped`);
          } else {
            piecesWithChanges.push(piece);
            console.log(`  ✓ ${piece} - has translation changes and needs version bump`);
          }
        } else {
          console.log(`  - ${piece} - has changes but not translation-related`);
        }
      } else {
        console.log(`  - ${piece} - has changes but no i18n directory`);
      }
    } else {
      console.log(`  - ${piece} - no changes`);
    }
  }
  
  if (piecesWithChanges.length === 0) {
    console.log('\nNo pieces with translation changes found.');
    return;
  }
  
  console.log(`\nFound ${piecesWithChanges.length} pieces with translation changes:`);
  piecesWithChanges.forEach(piece => console.log(`  - ${piece}`));
  
  console.log('\nBumping patch versions...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const piece of piecesWithChanges) {
    const packageJsonPath = path.join(piecesDir, piece, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      const result = updatePackageJson(packageJsonPath);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    } else {
      console.error(`Package.json not found for ${piece}`);
      errorCount++;
    }
  }
  
  console.log(`\nSummary:`);
  console.log(`  Successfully updated: ${successCount} pieces`);
  console.log(`  Errors: ${errorCount} pieces`);
}

// Run the script
main();