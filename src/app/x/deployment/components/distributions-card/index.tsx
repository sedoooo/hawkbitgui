'use client';

import styles from './styles.module.scss';
import IconButton from '@/app/components/icon-button';
import { Modal } from '@/app/components/modal';
import FilterIcon from '@/app/components/icons/filter-icon';
import CreateTargetFormContainer from '../../containers/create-target-form-container';
import PanelCard from '@/app/components/panel-card';
import DistributionsTableContainer from '@/app/x/deployment/containers/distributions-table-container';
import DistributionFilters from '@/app/x/deployment/components/distribution-filters';
import ManageColumnsButton from '@/app/components/manage-columns-button';
import { DISTRIBUTIONS_TABLE_VISIBLE_COLUMNS_STORAGE_KEY, useDistributionsTableStore } from '@/stores/distributions-table-store';

type DistributionsCardProps = {
  isExpanded: boolean;
  onToggleExpand: () => void;
  isCreateDistributionFormOpen: boolean;
  onCloseCreateDistributionForm: () => void;
  isDistributionsFiltersModalOpen: boolean;
  onOpenDistributionsFiltersModal: () => void;
  onCloseDistributionsFiltersModal: () => void;
};

export default function DistributionsCard({
  isExpanded,
  onToggleExpand,
  isCreateDistributionFormOpen,
  onCloseCreateDistributionForm,
  isDistributionsFiltersModalOpen,
  onOpenDistributionsFiltersModal,
  onCloseDistributionsFiltersModal,
}: DistributionsCardProps) {
  const visibleColumns = useDistributionsTableStore((state) => state.visibleColumns);
  const setVisibleColumns = useDistributionsTableStore((state) => state.setVisibleColumns);

  return (
    <>
      <PanelCard expanded={isExpanded}>
        <PanelCard.Header title='Distributions' onToggleExpand={onToggleExpand} isExpanded={isExpanded} />
        <PanelCard.Actions>
          <div className={styles.actionButtons}>
            <ManageColumnsButton columns={visibleColumns} setVisibleColumns={setVisibleColumns} storageKey={DISTRIBUTIONS_TABLE_VISIBLE_COLUMNS_STORAGE_KEY} />
            <IconButton onClick={onOpenDistributionsFiltersModal} className={styles.filterButton}>
              <FilterIcon />
            </IconButton>
          </div>
        </PanelCard.Actions>
        <PanelCard.Content>
          <DistributionsTableContainer />
        </PanelCard.Content>
      </PanelCard>

      <Modal isOpen={isCreateDistributionFormOpen} onClose={onCloseCreateDistributionForm} size={'md'}>
        <CreateTargetFormContainer onSubmitSuccess={onCloseCreateDistributionForm} onCancel={onCloseCreateDistributionForm} />
      </Modal>
      <Modal isOpen={isDistributionsFiltersModalOpen} onClose={onCloseDistributionsFiltersModal} size={'fitContent'}>
        <DistributionFilters />
      </Modal>
    </>
  );
}
