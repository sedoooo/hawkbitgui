import ArtifactsTableContainer from '../../containers/artifacts-table-container';
import { useSoftwareModulesStore } from '@/stores/software-modules-store';
import { useMemo } from 'react';
import StaticCard from '@/app/components/static-card';
import ManageColumnsButton from '@/app/components/manage-columns-button';
import { ARTIFACTS_TABLE_VISIBLE_COLUMNS_STORAGE_KEY, useArtifactsTableStore } from '@/stores/artifacts-table-store';

export default function ArtifactsCard() {
  const selectedSoftwareModule = useSoftwareModulesStore((state) => state.selectedSoftwareModule);

  const cardTitle = useMemo(() => {
    return selectedSoftwareModule ? `Artifacts Details: ${selectedSoftwareModule.name}:${selectedSoftwareModule.version}` : 'Artifacts';
  }, [selectedSoftwareModule]);

  const visibleColumns = useArtifactsTableStore((state) => state.visibleColumns);
  const setVisibleColumns = useArtifactsTableStore((state) => state.setVisibleColumns);

  return (
    <StaticCard>
      <StaticCard.Header>
        <StaticCard.Title>{cardTitle}</StaticCard.Title>
        <StaticCard.Actions>
          <ManageColumnsButton columns={visibleColumns} setVisibleColumns={setVisibleColumns} storageKey={ARTIFACTS_TABLE_VISIBLE_COLUMNS_STORAGE_KEY} />
        </StaticCard.Actions>
      </StaticCard.Header>
      <StaticCard.Divider />
      <StaticCard.Body>
        <ArtifactsTableContainer />
      </StaticCard.Body>
    </StaticCard>
  );
}
