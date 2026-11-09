'use client';

import { Distribution } from '@/entities';
import React, { useState } from 'react';
import ConfirmDeleteModal from '@/app/components/confirm-delete-modal';
import { useConfirmDialog } from '@/app/hooks';
import DistributionsTable from '@/app/x/deployment/components/distributions-table';
import { useDistributionsTableStore } from '@/stores/distributions-table-store';
import { DistributionSetsService } from '@/services/distribution-sets-service';
import { Modal } from '@/app/components/modal';
import DistributionInfo from '@/app/x/deployment/components/distribution-info';
import { useDistributionsPolling } from '@/app/hooks/use-distributions-polling';
import ListFilterBar from '@/app/components/list-filter-bar';
import { useGetDistributionSetTypes } from '@/app/x/distribution-set-types/hooks/use-get-distribution-set-types';
import { EMPTY_LIST_FILTERS, getDistinctTypeOptions, type ListFilterState } from '@/utils/list-filters';

export default function DistributionsTableContainer() {
  const filteredDistributions = useDistributionsTableStore((state) => state.filteredDistributions);
  const isLoading = useDistributionsTableStore((state) => state.isLoading);
  const visibleColumns = useDistributionsTableStore((state) => state.visibleColumns);
  const fetchDistributions = useDistributionsTableStore((state) => state.fetchDistributions);
  const page = useDistributionsTableStore((state) => state.page);
  const size = useDistributionsTableStore((state) => state.size);
  const total = useDistributionsTableStore((state) => state.total);
  const setPage = useDistributionsTableStore((state) => state.setPage);
  const sorting = useDistributionsTableStore((state) => state.sorting);
  const setSorting = useDistributionsTableStore((state) => state.setSorting);
  const listFilters = useDistributionsTableStore((state) => state.listFilters);
  const setListFilters = useDistributionsTableStore((state) => state.setListFilters);
  const distributionsTableStore = useDistributionsTableStore();
  const { data: distributionSetTypes } = useGetDistributionSetTypes();

  const typeOptions = getDistinctTypeOptions(
    (distributionSetTypes ?? []).filter((type) => !type.deleted).map((type) => type.key),
    (key) => (distributionSetTypes ?? []).find((type) => type.key === key)?.name ?? key
  );

  const [isDistributionInfoModalOpen, setIsDistributionInfoModalOpen] = useState(false);

  const confirmDialog = useConfirmDialog<Distribution>();

  const handleDeleteClick = (distribution: Distribution) => {
    confirmDialog.open(distribution, async () => {
      await DistributionSetsService.deleteDistributionSet(distribution.id);
      await fetchDistributions();
      distributionsTableStore.resetSelectedDistribution();
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchDistributions();
  };

  const handleSortingChange = (newSorting: typeof sorting) => {
    setSorting(newSorting);
    fetchDistributions();
  };

  const handleListFiltersChange = (nextFilters: ListFilterState) => {
    setListFilters(nextFilters);
    fetchDistributions();
  };

  const handleListFiltersReset = () => {
    setListFilters({ ...EMPTY_LIST_FILTERS });
    fetchDistributions();
  };

  useDistributionsPolling();

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        <ListFilterBar
          filters={listFilters}
          typeOptions={typeOptions}
          typeLabel='Type'
          onChange={handleListFiltersChange}
          onReset={handleListFiltersReset}
          testIdPrefix='deployment-distributions-filter'
        />
        <DistributionsTable
          distributions={filteredDistributions.map((distribution) => ({
            ...distribution,
            status: 'Error',
          }))}
          visibleColumns={visibleColumns}
          onNameClick={(distribution) => {
            distributionsTableStore.setSelectedDistribution(distribution);
            setIsDistributionInfoModalOpen(true);
          }}
          pagination={{
            page,
            size,
            totalItems: total,
          }}
          onDeleteClick={handleDeleteClick}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          sorting={sorting}
          onSortingChange={handleSortingChange}
        />
      </div>
      <Modal isOpen={isDistributionInfoModalOpen} variant='unstyled' size='lg' onClose={() => setIsDistributionInfoModalOpen(false)}>
        <DistributionInfo />
      </Modal>
      <ConfirmDeleteModal isOpen={confirmDialog.isOpen} onConfirm={confirmDialog.confirm} onClose={confirmDialog.close}>
        <ConfirmDeleteModal.Message>
          Are you sure you want to delete distribution <span style={{ fontWeight: 'bold' }}>{confirmDialog.data?.name}</span>?
        </ConfirmDeleteModal.Message>
      </ConfirmDeleteModal>
    </>
  );
}
