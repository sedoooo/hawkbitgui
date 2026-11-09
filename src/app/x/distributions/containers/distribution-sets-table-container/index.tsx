'use client';

import DistributionSetsTable from '../../components/distribution-sets-table';
import { Modal } from '@/app/components/modal';
import { useEffect, useState } from 'react';
import DistributionSetInfo from '../../components/distribution-set-info';
import { useDistributionsSetsTableStore } from '@/stores/distribution-sets-table-store';
import { Distribution } from '@/entities';
import ConfirmDeleteModal from '@/app/components/confirm-delete-modal';
import { useConfirmDialog } from '@/app/hooks';
import { useDeleteDistributionSet } from '../../hooks/use-delete-distribution-set';
import EditDistributionSetFormContainer from '../edit-distribution-set-form-container';
import { useGetPaginatedDistributionSets } from '../../hooks/use-get-paginated-distribution-sets';
import { useTableSorting } from '@/app/hooks/use-table-sorting';
import ListFilterBar from '@/app/components/list-filter-bar';
import { useGetDistributionSetTypes } from '@/app/x/distribution-set-types/hooks/use-get-distribution-set-types';
import { buildListFilterQuery, EMPTY_LIST_FILTERS, getDistinctTypeOptions, type ListFilterState } from '@/utils/list-filters';

export default function DistributionSetsTableContainer() {
  const { sorting, setSorting } = useTableSorting();
  const [listFilters, setListFilters] = useState<ListFilterState>(EMPTY_LIST_FILTERS);
  const listFilterQuery = buildListFilterQuery(listFilters, { typeField: 'type', dateField: 'createdAt' });
  const { data: distributionSetsData, refetch, isLoading } = useGetPaginatedDistributionSets({ sorting, extraQuery: listFilterQuery });
  const { distributionSets, totalDistributionSets } = distributionSetsData ?? { distributionSets: [], totalDistributionSets: 0 };
  const { data: distributionSetTypes } = useGetDistributionSetTypes();

  const typeOptions = getDistinctTypeOptions(
    (distributionSetTypes ?? []).filter((type) => !type.deleted).map((type) => type.key),
    (key) => (distributionSetTypes ?? []).find((type) => type.key === key)?.name ?? key
  );

  const visibleColumns = useDistributionsSetsTableStore((state) => state.visibleColumns);

  const page = useDistributionsSetsTableStore((state) => state.page);
  const size = useDistributionsSetsTableStore((state) => state.size);
  const setPage = useDistributionsSetsTableStore((state) => state.setPage);

  const handleSortingChange = (newSorting: typeof sorting) => {
    setSorting(newSorting);
    setPage(0);
  };

  const handleListFiltersChange = (nextFilters: ListFilterState) => {
    setListFilters(nextFilters);
    setPage(0);
  };

  const handleListFiltersReset = () => {
    setListFilters({ ...EMPTY_LIST_FILTERS });
    setPage(0);
  };

  const setSelectedDistribution = useDistributionsSetsTableStore((state) => state.setSelectedDistribution);
  const selectedDistribution = useDistributionsSetsTableStore((state) => state.selectedDistribution);

  useEffect(() => {
    if (selectedDistribution) {
      const updatedDistribution = distributionSets?.find((ds) => ds.id === selectedDistribution.id);
      if (updatedDistribution) {
        setSelectedDistribution(updatedDistribution);
      }
    }
  }, [distributionSets, selectedDistribution, setSelectedDistribution]);

  const [isDistributionSetInfoModalOpen, setIsDistributionSetInfoModalOpen] = useState(false);
  const [isEditDistributionSetFormOpen, setIsEditDistributionSetFormOpen] = useState(false);
  const confirmDialog = useConfirmDialog<Distribution>();

  const { deleteDistributionSet } = useDeleteDistributionSet();

  const handleNameClick = (distributionSet: Distribution) => {
    setSelectedDistribution(distributionSet);
    setIsDistributionSetInfoModalOpen(true);
  };

  const handleEditClick = (distributionSet: Distribution) => {
    setSelectedDistribution(distributionSet);
    setIsEditDistributionSetFormOpen(true);
  };

  const handleDeleteClick = (distributionSet: Distribution) => {
    confirmDialog.open(distributionSet, async () => {
      await deleteDistributionSet(distributionSet.id);
      refetch();
    });
  };

  const closeInfoModal = () => {
    setIsDistributionSetInfoModalOpen(false);
    setSelectedDistribution(undefined);
  };

  const closeEditForm = () => {
    setIsEditDistributionSetFormOpen(false);
    setSelectedDistribution(undefined);
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        <ListFilterBar
          filters={listFilters}
          typeOptions={typeOptions}
          typeLabel='Type'
          onChange={handleListFiltersChange}
          onReset={handleListFiltersReset}
          testIdPrefix='distribution-sets-filter'
        />
        <DistributionSetsTable
          distributionSets={distributionSets ?? []}
          isLoading={isLoading}
          visibleColumns={visibleColumns}
          pagination={{
            page,
            size,
            totalItems: totalDistributionSets,
          }}
          onNameClick={handleNameClick}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
          onPageChange={setPage}
          sorting={sorting}
          onSortingChange={handleSortingChange}
        />
      </div>
      {isEditDistributionSetFormOpen && selectedDistribution && (
        <Modal isOpen={isEditDistributionSetFormOpen} onClose={closeEditForm}>
          <Modal.Header>Edit distribution set</Modal.Header>
          <Modal.Content>
            <EditDistributionSetFormContainer distributionSet={selectedDistribution} onSubmitSuccess={closeEditForm} onCancel={closeEditForm} />
          </Modal.Content>
        </Modal>
      )}
      <ConfirmDeleteModal isOpen={confirmDialog.isOpen} onConfirm={confirmDialog.confirm} onClose={confirmDialog.close}>
        <ConfirmDeleteModal.Message>
          Are you sure you want to delete rollout <span style={{ fontWeight: 'bold' }}>{confirmDialog.data?.name}</span>?
        </ConfirmDeleteModal.Message>
      </ConfirmDeleteModal>
      <Modal isOpen={isDistributionSetInfoModalOpen} variant='unstyled' size='lg' onClose={closeInfoModal}>
        <DistributionSetInfo />
      </Modal>
    </>
  );
}
