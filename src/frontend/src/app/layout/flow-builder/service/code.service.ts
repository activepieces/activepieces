import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import * as JSZip from 'jszip';
import { catchError, from, map, Observable, of, switchMap, tap } from 'rxjs';
import { Artifact } from '../model/artifact.interface';
import { UUID } from 'angular2-uuid';
import { ArtifactCacheKey, StepCacheKey } from './artifact-cache-key';
import { CodeTestExecutionResult } from '../../common-layout/model/flow-builder/code-test-execution-result';
import { ArtifactAndItsNameInFormData } from '../../common-layout/model/helper/artifacts-zipping-helper';

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
	artifactsCacheForCollectionConfigs: ArtifactsCache = new Map();
	artifactsCacheForSteps: ArtifactsCache = new Map();
	cachedFile: Map<String, any> = new Map<String, any>();

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

	executeTest(artifact: Artifact, context: any): Observable<CodeTestExecutionResult> {
		const formData = new FormData();
		const zippedFile$ = CodeService.zipFile(artifact);
		return zippedFile$.pipe(
			switchMap(zippedFile => {
				const file = new File([new Blob([zippedFile])], 'artifact.zip');
				formData.append('artifact', file);
				formData.append('input', new Blob([JSON.stringify(context)], { type: 'application/json' }));
				return this.http.post<CodeTestExecutionResult>(environment.apiUrl + '/execute-code', formData);
			})
		);
	}

	public helloWorld(): Artifact {
		return {
			content: 'exports.code = async (params) => {\n' + '    return true;\n' + '};\n',
			package: '{\n' + '  "dependencies": {\n' + '  }\n' + '}\n',
		};
	}

	static zipFile(artifact: Artifact): Observable<string | Uint8Array> {
		const zip = new JSZip();
		zip.folder('build');
		zip.file('build/index.js', artifact.content, {
			createFolders: false,
		});
		zip.file('build/package.json', artifact.package, {
			createFolders: false,
		});

		if (JSZip.support.uint8array) {
			return from(zip.generateAsync({ type: 'uint8array' }));
		} else {
			return from(zip.generateAsync({ type: 'string' }));
		}
	}

	public readFile(filename: string): Observable<Artifact> {
		return this.downloadFile(filename).pipe(
			switchMap(async file => {
				const content = { content: '', package: '' };
				// @ts-ignore
				const zipFile = await JSZip.loadAsync(file);
				for (const filename1 of Object.keys(zipFile.files)) {
					if (filename1.split('/').length > 2) continue;
					if (filename1.endsWith('index.js') || filename1.endsWith('package.json')) {
						const fileData = await zipFile.files[filename1].async('string');
						if (filename1.endsWith('index.js')) {
							content.content = fileData;
						} else if (filename1.endsWith('package.json')) {
							content.package = fileData;
						}
					}
				}
				return content;
			})
		);
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

	private getArtifactFromCache(
		artifactsCache: ArtifactsCache,
		artifactKey: string,
		artifactUrl: string,
		uploadNewArtifacts: boolean = true
	) {
		const artifactCacheResult = artifactsCache.get(artifactKey);
		if (artifactCacheResult) {
			return of(artifactCacheResult.artifact);
		} else if (artifactUrl) {
			return this.readFile(artifactUrl).pipe(
				tap(artifact => {
					artifactsCache.set(artifactKey, { artifact: artifact, needsToBeUploadedToServer: false });
				})
			);
		}
		//In case this is a newly added code step/config :D
		artifactsCache.set(artifactKey, { artifact: this.helloWorld(), needsToBeUploadedToServer: uploadNewArtifacts });
		return of(this.helloWorld());
	}

	getOrCreateStepArtifact(stepCacheKey: StepCacheKey, artifactUrl: string) {
		return this.getArtifactFromCache(this.artifactsCacheForSteps, stepCacheKey.toString(), artifactUrl);
	}

	private removeFromCache(artifactsCache: ArtifactsCache, artifactKey: string) {
		artifactsCache.delete(artifactKey);
	}

	removeArtifactInFlowStepsCache(artifactKey: StepCacheKey) {
		this.removeFromCache(this.artifactsCacheForSteps, artifactKey.toString());
	}

	private updateArtifactInCache(artifactsCache: ArtifactsCache, artifactKey: string, artifact: Artifact) {
		const cacheResult = artifactsCache.get(artifactKey);
		if (!cacheResult) {
			throw new Error(`trying to update an empty artifacts' cache entry,  ${artifactKey}`);
		}
		cacheResult.needsToBeUploadedToServer = true;
		cacheResult.artifact = artifact;
	}

	updateArtifactInFlowStepsCache(artifactKey: StepCacheKey, artifact: Artifact) {
		this.updateArtifactInCache(this.artifactsCacheForSteps, artifactKey.toString(), artifact);
	}

	private getDirtyArtifactsFromCache(cache: ArtifactsCache, incompleteArtifactKey: ArtifactCacheKey) {
		const dirtyArtifacts: ArtifactAndItsNameInFormData[] = [];
		const getArtifactNameMethod = CodeService.getArtifactNameMethod(incompleteArtifactKey);
		cache.forEach((cacheResult, key) => {
			if (key.startsWith(`${incompleteArtifactKey.toString()}`) && cacheResult.needsToBeUploadedToServer) {
				const artifactAndName = { artifact: cacheResult.artifact, name: getArtifactNameMethod(key) };
				dirtyArtifacts.push(artifactAndName);
			}
		});
		return dirtyArtifacts;
	}
	private static getArtifactNameMethod(artifactCacheKey: ArtifactCacheKey) {
		if (artifactCacheKey instanceof StepCacheKey) {
			return StepCacheKey.getStepName;
		}
		throw new Error('Aritfact cache key type has no method to get artifact name');
	}

	getDirtyArtifactsForFlowSteps(flowId: UUID) {
		return this.getDirtyArtifactsFromCache(this.artifactsCacheForSteps, new StepCacheKey(flowId, ''));
	}
	private unmarkDirtyArtifacts(cache: ArtifactsCache, incompleteArtifactKey: ArtifactCacheKey) {
		cache.forEach((result, key) => {
			if (key.startsWith(`${incompleteArtifactKey.toString()}`)) {
				result.needsToBeUploadedToServer = false;
			}
		});
	}
	unmarkDirtyArtifactsInFlowStepsCache(flowId: UUID) {
		this.unmarkDirtyArtifacts(this.artifactsCacheForCollectionConfigs, new StepCacheKey(flowId, ''));
	}
}
