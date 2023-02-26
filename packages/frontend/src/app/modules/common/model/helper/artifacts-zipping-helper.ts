import { map, Observable } from 'rxjs';
import { Artifact } from '../../../flow-builder/model/artifact.interface';
import { CodeService } from '../../../flow-builder/service/code.service';

export type ArtifactAndItsNameInFormData = {
  name: string;
  artifact: Artifact;
};

export function zipAllArtifacts(
  artifactsAndNamesInFormData: ArtifactAndItsNameInFormData[]
) {
  const zipRequests$: Observable<{
    name: string;
    file: string | Uint8Array;
  }>[] = [];
  artifactsAndNamesInFormData.forEach((a) => {
    zipRequests$.push(
      CodeService.zipFile(a.artifact).pipe(
        map((file) => {
          return { file: file, name: a.name };
        })
      )
    );
  });
  if (zipRequests$.length === 0) return [];
  return zipRequests$;
}

export function addArtifactsToFormData(
  zippedFilesAndTheirNames: { name: string; file: string | Uint8Array }[],
  formData: FormData
) {
  zippedFilesAndTheirNames.forEach((f) => {
    formData.append(
      'artifacts',
      new Blob([f.file], {
        type: 'application/zip',
      }),
      `${f.name}.zip`
    );
  });
}
