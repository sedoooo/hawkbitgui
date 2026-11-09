import { useTargetFiltersPageStore } from '@/stores/target-filters-page-store';
import TargetFilterTargetsTable from '../../components/target-filter-targets-table';
import { useGetPaginatedTargets } from '@/app/x/deployment/hooks/use-get-paginated-targets';
import { useTargetsTableStore } from '@/stores/targets-table-store';
import { useTargetFilterTargetsTableStore } from '@/stores/target-filter-targets-table-store';
import { useTableSorting } from '@/app/hooks/use-table-sorting';

export default function TargetFilterTargetsTableContainer() {
  const { sorting, setSorting } = useTableSorting();
  const currentQuery = useTargetFiltersPageStore((state) => state.currentQuery);

  const { data: selectedTargetsData, isLoading } = useGetPaginatedTargets({
    queryParams: { q: currentQuery },
    sorting,
    queryOptions: { enabled: !!currentQuery },
  });
  const { targets, totalTargets } = selectedTargetsData ?? { targets: [], totalTargets: 0 };

  const visibleColumns = useTargetFilterTargetsTableStore((state) => state.visibleColumns);

  const page = useTargetsTableStore((state) => state.page);
  const size = useTargetsTableStore((state) => state.size);
  const setPage = useTargetsTableStore((state) => state.setPage);

  const handleSortingChange = (newSorting: typeof sorting) => {
    setSorting(newSorting);
    setPage(0);
  };

  return (
    <TargetFilterTargetsTable
      targets={targets}
      isLoading={isLoading}
      pagination={{
        page,
        size,
        totalItems: totalTargets,
      }}
      onControllerIdClick={() => {}}
      onPageChange={setPage}
      sorting={sorting}
      onSortingChange={handleSortingChange}
      visibleColumns={visibleColumns}
    />
  );
}
