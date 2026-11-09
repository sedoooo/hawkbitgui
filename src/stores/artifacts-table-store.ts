import { create } from 'zustand';
import { VisibleColumn } from '@/types/utils/visible-column';
import { SoftwareModuleArtifactKey } from '@/entities/software-module-artifact';
import { getColumnVisibilityStorageKey } from '@/utils/columns-visibility';

export const ARTIFACTS_TABLE_VISIBLE_COLUMNS_STORAGE_KEY = getColumnVisibilityStorageKey('upload-artifacts-table');

type ArtifactsTableColumnKey = SoftwareModuleArtifactKey | 'hashes.sha1' | 'hashes.md5' | 'hashes.sha256';

const DEFAULT_VISIBLE_COLUMNS: Partial<Record<ArtifactsTableColumnKey, VisibleColumn>> = {
  providedFilename: {
    id: 'providedFilename',
    label: 'File name',
    isSelected: true,
  },
  size: {
    id: 'size',
    label: 'Size (B)',
    isSelected: true,
  },
  'hashes.sha1': {
    id: 'hashes.sha1',
    label: 'SHA1 checksum',
    isSelected: true,
  },
  'hashes.md5': {
    id: 'hashes.md5',
    label: 'MD5 checksum',
    isSelected: true,
  },
  'hashes.sha256': {
    id: 'hashes.sha256',
    label: 'SHA256 checksum',
    isSelected: true,
  },
  lastModifiedAt: {
    id: 'lastModifiedAt',
    label: 'Last modified',
    isSelected: true,
  },
};

interface ArtifactsTableState {
  visibleColumns: Partial<Record<ArtifactsTableColumnKey, VisibleColumn>>;
  setVisibleColumns: (columns: Record<string, VisibleColumn>) => void;
}

export const useArtifactsTableStore = create<ArtifactsTableState>((set) => ({
  visibleColumns: DEFAULT_VISIBLE_COLUMNS,
  setVisibleColumns: (columns) => set({ visibleColumns: columns }),
}));
