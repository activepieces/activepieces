import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// TODO - remove this dependency but its import Buffer which breaks compilation since framework has nodejs types
import JSZip from 'jszip';
import { catchError, map, Observable, of } from 'rxjs';
import { SourceCode } from '@activepieces/shared';

type NpmPkg = {
  'dist-tags': {
    latest: string;
  };
};
type PackageName = string;
type PackageVersion = string;

@Injectable({
  providedIn: 'root',
})
export class CodeService {
  constructor(private http: HttpClient) {}

  public beautifyJson(content: any) {
    return JSON.stringify(content, null, 2);
  }

  public helloWorldArtifact(): SourceCode {
    return {
      packageJson: `
      {
        "dependencies": {
        }
      }`,
      code: `export const code = async (inputs) => {
  return true;
};`,
    };
  }

  public async readFile(file: any) {
    const content = { content: '', package: '' };
    const zipFile = await JSZip.loadAsync(file);
    for (const filename of Object.keys(zipFile.files)) {
      if (filename.split('/').length > 2) continue;
      if (
        filename.endsWith('index.ts') ||
        filename.endsWith('index.js') ||
        filename.endsWith('package.json')
      ) {
        const fileData = await zipFile.files[filename].async('string');
        if (filename.endsWith('index.ts') || filename.endsWith('index.js')) {
          content.content = fileData;
        } else if (filename.endsWith('package.json')) {
          content.package = fileData;
        }
      }
    }
    return content;
  }

  getNpmPackage(npmName: string): Observable<NpmPkg> {
    return this.http.get<NpmPkg>(
      'https://registry.npmjs.org/' + npmName,
      undefined
    );
  }

  getLatestVersionOfNpmPackage(
    npmName: string
  ): Observable<{ [key: PackageName]: PackageVersion } | null> {
    return this.getNpmPackage(npmName).pipe(
      map((pkg) => {
        const pkgJson: Record<string, string> = {};
        if (pkg) {
          pkgJson[npmName] = pkg['dist-tags'].latest;
        }
        return pkgJson;
      }),
      catchError(() => {
        return of(null);
      })
    );
  }
}
