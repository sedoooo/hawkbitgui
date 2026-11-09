'use client';

import styles from './styles.module.scss';
import Button from '@/app/components/button';
import IconButton from '@/app/components/icon-button';
import { Modal } from '@/app/components/modal';
import FilterIcon from '@/app/components/icons/filter-icon';
import TargetFilters from '@/app/components/target-filters';
import PanelCard from '@/app/components/panel-card';
import TargetTableContainer from '@/app/x/deployment/containers/target-table-container';
import CreateTargetFormContainer from '@/app/x/deployment/containers/create-target-form-container';
import ExpandableSearchBarContainer from '@/app/x/deployment/containers/expandable-search-bar-container';
import ManageColumnsButton from '@/app/components/manage-columns-button';
import { TARGETS_TABLE_VISIBLE_COLUMNS_STORAGE_KEY, useTargetsTableStore } from '@/stores/targets-table-store';

type TargetsCardProps = {
  isExpanded: boolean;
  onToggleExpand: () => void;
  isCreateTargetFormOpen: boolean;
  onOpenCreateTargetForm: () => void;
  onCloseCreateTargetForm: () => void;
  isTargetFiltersModalOpen: boolean;
  onOpenTargetFiltersModal: () => void;
  onCloseTargetFiltersModal: () => void;
};

export default function TargetsCard({
  isExpanded,
  onToggleExpand,
  isCreateTargetFormOpen,
  onOpenCreateTargetForm,
  onCloseCreateTargetForm,
  isTargetFiltersModalOpen,
  onOpenTargetFiltersModal,
  onCloseTargetFiltersModal,
}: TargetsCardProps) {
  const visibleColumns = useTargetsTableStore((state) => state.visibleColumns);
  const setVisibleColumns = useTargetsTableStore((state) => state.setVisibleColumns);

  return (
    <>
      <PanelCard expanded={isExpanded}>
        <PanelCard.Header title='Targets' isExpanded={isExpanded} onToggleExpand={onToggleExpand}>
          <ExpandableSearchBarContainer />
        </PanelCard.Header>

        <PanelCard.Actions>
          <div className={styles.mainActions}>
            <Button onClick={onOpenCreateTargetForm}>+ New target</Button>
            {/*<Button variant='outline' className={styles.bulkUploadButton}>*/}
            {/*  <FolderIcon />*/}
            {/*  Bulk Upload Targets*/}
            {/*</Button>*/}
          </div>
          <div className={styles.cardActions}>
            <ManageColumnsButton columns={visibleColumns} setVisibleColumns={setVisibleColumns} storageKey={TARGETS_TABLE_VISIBLE_COLUMNS_STORAGE_KEY} />
            <IconButton className={styles.filterButton} onClick={onOpenTargetFiltersModal}>
              <FilterIcon />
            </IconButton>
          </div>
        </PanelCard.Actions>

        <PanelCard.Content>
          <TargetTableContainer />
        </PanelCard.Content>
      </PanelCard>

      <Modal isOpen={isCreateTargetFormOpen} onClose={onCloseCreateTargetForm} size={'md'}>
        <CreateTargetFormContainer onSubmitSuccess={onCloseCreateTargetForm} onCancel={onCloseCreateTargetForm} />
      </Modal>
      <Modal isOpen={isTargetFiltersModalOpen} onClose={onCloseTargetFiltersModal} size={'fitContent'}>
        <TargetFilters />
      </Modal>
    </>
  );
}
