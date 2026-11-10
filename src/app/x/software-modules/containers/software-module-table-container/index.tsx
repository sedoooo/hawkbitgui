import SoftwareModuleTable from '../../components/software-module-table';
import { FilterFiql, SoftwareModule } from '@/entities';
import { useDeleteSoftwareModule } from '../../hooks/use-delete-software-module';
import ConfirmDeleteModal from '@/app/components/confirm-delete-modal';
import { useConfirmDialog } from '@/app/hooks';
import { useSoftwareModulesStore } from '@/stores/software-modules-store';
import { Modal } from '@/app/components/modal';
import { useState } from 'react';
import SoftwareModuleInfo from '../../components/software-module-info';
import EditSoftwareModuleFormContainer from '../edit-software-module-form-container';
import { useSoftwareModuleFiltersStore } from '@/stores/software-module-filters-store';
import { useGetPaginatedSoftwareModules } from '../../hooks/use-get-paginated-software-modules';
import { useTableSorting } from '@/app/hooks/use-table-sorting';
import { useGetSoftwareModuleTypes } from '@/app/x/software-module-types/hooks/use-get-software-module-types';
import ListFilterBar from '@/app/components/list-filter-bar';
import { buildListFilterQuery, combineQueryParts, EMPTY_LIST_FILTERS, getDistinctTypeOptions, type ListFilterState } from '@/utils/list-filters';

export default function SoftwareModuleTableContainer() {
  const { sorting, setSorting } = useTableSorting();
  const filters = useSoftwareModuleFiltersStore((state) => state.filters);
  const fiqlQueryParam = FilterFiql.parseFiltersToFeedItemQueryLanguage(Object.values(filters) ?? []);
  const [listFilters, setListFilters] = useState<ListFilterState>(EMPTY_LIST_FILTERS);
  const listFilterQuery = buildListFilterQuery(listFilters, { typeField: 'type', dateField: 'createdAt' });
  const query = combineQueryParts(fiqlQueryParam, listFilterQuery);
  const { data: softwareModulesData, refetch, isLoading } = useGetPaginatedSoftwareModules({ queryParams: { q: query }, sorting });
  const { softwareModules, totalSoftwareModules } = softwareModulesData ?? { softwareModules: [], totalSoftwareModules: 0 };
  const { data: softwareModuleTypes } = useGetSoftwareModuleTypes();

  const typeOptions = getDistinctTypeOptions(
    (softwareModuleTypes ?? []).filter((type) => !type.deleted).map((type) => type.key),
    (key) => (softwareModuleTypes ?? []).find((type) => type.key === key)?.name ?? key
  );

  const visibleColumns = useSoftwareModulesStore((state) => state.visibleColumns);

  const page = useSoftwareModulesStore((state) => state.page);
  const size = useSoftwareModulesStore((state) => state.size);
  const setPage = useSoftwareModulesStore((state) => state.setPage);

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

  const setSelectedSoftwareModule = useSoftwareModulesStore((state) => state.setSelectedSoftwareModule);
  const selectedSoftwareModule = useSoftwareModulesStore((state) => state.selectedSoftwareModule);
  const [isSoftwareModuleInfoModalOpen, setIsSoftwareModuleInfoModalOpen] = useState(false);
  const [isEditSoftwareModuleFormOpen, setIsEditSoftwareModuleFormOpen] = useState(false);
  const [expandedSoftwareModuleId, setExpandedSoftwareModuleId] = useState<number | undefined>(undefined);

  const { deleteSoftwareModule } = useDeleteSoftwareModule();

  const confirmDialog = useConfirmDialog<SoftwareModule>();

  const toggleExpandedSoftwareModule = (softwareModule: SoftwareModule) => {
    setExpandedSoftwareModuleId((current) => (current === softwareModule.id ? undefined : softwareModule.id));
  };

  const handleRowClick = (softwareModule: SoftwareModule) => {
    setSelectedSoftwareModule(softwareModule);
    toggleExpandedSoftwareModule(softwareModule);
  };

  const handlePageChange = (nextPage: number) => {
    setExpandedSoftwareModuleId(undefined);
    setPage(nextPage);
  };

  const handleNameClick = (softwareModule: SoftwareModule) => {
    setSelectedSoftwareModule(softwareModule);
    setIsSoftwareModuleInfoModalOpen(true);
  };

  const handleEditSoftwareModule = (softwareModule: SoftwareModule) => {
    setSelectedSoftwareModule(softwareModule);
    setIsEditSoftwareModuleFormOpen(true);
  };

  const handleDeleteSoftwareModule = (softwareModule: SoftwareModule) => {
    confirmDialog.open(softwareModule, async () => {
      if (!softwareModule) return;
      await deleteSoftwareModule({ softwareModuleId: softwareModule.id });
      refetch();
    });
  };

  const closeInfoModal = () => {
    setIsSoftwareModuleInfoModalOpen(false);
    setSelectedSoftwareModule(undefined);
  };

  const closeEditForm = () => {
    setIsEditSoftwareModuleFormOpen(false);
    setSelectedSoftwareModule(undefined);
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
          testIdPrefix='software-modules-filter'
        />
        <SoftwareModuleTable
          modules={softwareModules}
          isLoading={isLoading}
          visibleColumns={visibleColumns}
          pagination={{
            page,
            size,
            totalItems: totalSoftwareModules,
          }}
          onNameClick={handleNameClick}
          onEditClick={handleEditSoftwareModule}
          onDeleteClick={handleDeleteSoftwareModule}
          onRowClick={handleRowClick}
          onPageChange={handlePageChange}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          expandedSoftwareModuleId={expandedSoftwareModuleId}
          onToggleExpanded={toggleExpandedSoftwareModule}
        />
      </div>
      <Modal isOpen={isSoftwareModuleInfoModalOpen} variant='unstyled' size='lg' onClose={closeInfoModal}>
        <SoftwareModuleInfo />
      </Modal>
      {isEditSoftwareModuleFormOpen && selectedSoftwareModule && (
        <Modal isOpen={isEditSoftwareModuleFormOpen} onClose={closeEditForm}>
          <Modal.Header>Edit software module</Modal.Header>
          <Modal.Content>
            <EditSoftwareModuleFormContainer softwareModule={selectedSoftwareModule} onSubmitSuccess={closeEditForm} onCancel={closeEditForm} />
          </Modal.Content>
        </Modal>
      )}
      <ConfirmDeleteModal isOpen={confirmDialog.isOpen} onConfirm={confirmDialog.confirm} onClose={confirmDialog.close}>
        <ConfirmDeleteModal.Message>
          Are you sure you want to delete the software module <span style={{ fontWeight: 'bold' }}>{confirmDialog.data?.name}</span>?
        </ConfirmDeleteModal.Message>
      </ConfirmDeleteModal>
    </>
  );
}
