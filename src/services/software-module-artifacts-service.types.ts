import { SoftwareModuleArtifact } from '@/entities/software-module-artifact';

export interface UploadArtifactInput {
  softwareModuleId: number;
  file: File | Blob;
  filename: string;
}

export type UploadArtifactResponse = SoftwareModuleArtifact;

export interface GetArtifactsInput {
  softwareModuleId: number;
}

export type GetArtifactsResponse = SoftwareModuleArtifact[];

export interface DownloadArtifactInput {
  softwareModuleId: number;
  artifactId: number;
}
