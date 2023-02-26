import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import * as JSZip from 'jszip';
import { catchError, from, map, Observable, of, switchMap } from 'rxjs';
import { Artifact } from '../model/artifact.interface';
import { CodeExecutionResult } from '@activepieces/shared';

type NpmPkg = {
	'dist-tags': {
		latest: string;
	};
};
type PackageName = string;
type PackageVersion = string;
type ArtifactCacheResult = {
	artifact: Artifact;
	needsToBeUploadedToServer: boolean;
};

type ArtifactsCache = Map<string, ArtifactCacheResult>;

@Injectable({
	providedIn: 'root',
})
export class CodeService {
	artifactsCacheForFlowConfigs: ArtifactsCache = new Map();
	artifactsCacheForSteps: ArtifactsCache = new Map();
	cachedFile: Map<String, any> = new Map<String, Observable<ArrayBuffer>>();

	constructor(private http: HttpClient) {}

	public beautifyJson(content: any) {
		return JSON.stringify(content, null, 2);
	}

	private downloadFile(url: string) {
		if (this.cachedFile[url] == null) {
			this.cachedFile[url] = this.http.get(url, {
				responseType: 'arraybuffer',
			});
		}
		return this.cachedFile[url];
	}

	executeTest(artifact: Artifact, context: any): Observable<CodeExecutionResult> {
		return CodeService.zipFile(artifact).pipe(
			switchMap(zippedArtifact => {
				const zippedArtifactEncodedB64 = btoa(zippedArtifact);
				return this.http.post<CodeExecutionResult>(environment.apiUrl + '/codes/execute', {
					artifact: zippedArtifactEncodedB64,
					input: context,
				});
			})
		);
	}

	public helloWorld(): Artifact {
		return {
			content: 'exports.code = async (params) => {\n' + '    return true;\n' + '};\n',
			package: '{\n' + '  "dependencies": {\n' + '  }\n' + '}\n',
		};
	}

	public helloWorldBase64(): string {
		return 'UEsDBAoAAAAAAIGZWlYSIpQ2PAAAADwAAAAIAAAAaW5kZXgudHNleHBvcnQgY29uc3QgY29kZSA9IGFzeW5jIChwYXJhbXMpID0+IHsKICAgIHJldHVybiB0cnVlOwp9OwpQSwMECgAAAAAAgZlaVhpS0QgcAAAAHAAAAAwAAABwYWNrYWdlLmpzb257CiAgImRlcGVuZGVuY2llcyI6IHsKICB9Cn0KUEsBAhQACgAAAAAAgZlaVhIilDY8AAAAPAAAAAgAAAAAAAAAAAAAAAAAAAAAAGluZGV4LnRzUEsBAhQACgAAAAAAgZlaVhpS0QgcAAAAHAAAAAwAAAAAAAAAAAAAAAAAYgAAAHBhY2thZ2UuanNvblBLBQYAAAAAAgACAHAAAACoAAAAAAA=';
	}

	static zipFile(artifact: Artifact): Observable<string> {
		const zip = new JSZip();
		zip.file('index.ts', artifact.content, {
			createFolders: false,
		});
		zip.file('package.json', artifact.package, {
			createFolders: false,
		});

		return from(zip.generateAsync({ type: 'string' }));
	}

	public downloadAndReadFile(filename: string): Observable<Artifact> {
		return this.downloadFile(filename).pipe(
			switchMap(async (file: ArrayBuffer) => {
				const content = { content: '', package: '' };
				// @ts-ignore

				const zipFile = await JSZip.loadAsync(file);
				for (const filename of Object.keys(zipFile.files)) {
					if (filename.split('/').length > 2) continue;
					if (filename.endsWith('index.ts') || filename.endsWith('index.js') || filename.endsWith('package.json')) {
						const fileData = await zipFile.files[filename].async('string');
						if (filename.endsWith('index.js') || filename.endsWith('index.ts')) {
							content.content = fileData;
						} else if (filename.endsWith('package.json')) {
							content.package = fileData;
						}
					}
				}
				return content;
			})
		);
	}
	public async readFile(file) {
		const content = { content: '', package: '' };
		// @ts-ignore
		const zipFile = await JSZip.loadAsync(file);
		for (const filename of Object.keys(zipFile.files)) {
			if (filename.split('/').length > 2) continue;
			if (filename.endsWith('index.ts') || filename.endsWith('index.js') || filename.endsWith('package.json')) {
				const fileData = await zipFile.files[filename].async('string');
				if (filename.endsWith('index.js') || filename.endsWith('index.ts')) {
					content.content = fileData;
				} else if (filename.endsWith('package.json')) {
					content.package = fileData;
				}
			}
		}
		return content;
	}

	getNpmPackage(npmName: string): Observable<NpmPkg> {
		return this.http.get<NpmPkg>('https://registry.npmjs.org/' + npmName, undefined);
	}

	getLatestVersionOfNpmPackage(npmName: string): Observable<{ [key: PackageName]: PackageVersion } | null> {
		return this.getNpmPackage(npmName).pipe(
			map(pkg => {
				const pkgJson = {};
				pkgJson[npmName] = pkg['dist-tags'].latest;
				return pkgJson;
			}),
			catchError(() => {
				return of(null);
			})
		);
	}

	static constructFileUrl(artifactSourceId: string): string {
		return environment.apiUrl + `/files/${artifactSourceId}`;
	}
}
