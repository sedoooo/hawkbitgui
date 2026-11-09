'use client';

import PanelCard from '@/app/components/panel-card';
import ActionHistoryTableContainer from '@/app/x/deployment/containers/action-history-table-container';
import ManageColumnsButton from '@/app/components/manage-columns-button';
import { TARGET_ACTIONS_TABLE_VISIBLE_COLUMNS_STORAGE_KEY, useTargetActionsTableStore } from '@/stores/target-action-table-store';

type TargetsCardProps = {
  isExpanded: boolean;
  onToggleExpand: () => void;
};

export default function ActionHistoryCard({ isExpanded, onToggleExpand }: TargetsCardProps) {
  const visibleColumns = useTargetActionsTableStore((state) => state.visibleColumns);
  const setVisibleColumns = useTargetActionsTableStore((state) => state.setVisibleColumns);

  return (
    <>
      <PanelCard expanded={isExpanded}>
        <PanelCard.Header title='Action History' isExpanded={isExpanded} onToggleExpand={onToggleExpand}></PanelCard.Header>

        <PanelCard.Actions>
          <ManageColumnsButton columns={visibleColumns} setVisibleColumns={setVisibleColumns} storageKey={TARGET_ACTIONS_TABLE_VISIBLE_COLUMNS_STORAGE_KEY} />
        </PanelCard.Actions>

        <PanelCard.Content>
          <ActionHistoryTableContainer />
        </PanelCard.Content>
      </PanelCard>
    </>
  );
}
