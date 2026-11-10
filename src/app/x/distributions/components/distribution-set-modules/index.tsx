'use client';

import Table from '@/app/components/table';
import { Distribution, SoftwareModule } from '@/entities';
import { createColumnHelper } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import TrashIcon from '@/app/components/icons/trash-icon';
import ChevronDownIcon from '@/app/components/icons/chevron-down-icon';
import TooltipIconButton from '@/app/components/tooltip-icon-button';
import ActionIconButtons from '@/app/components/action-icon-buttons';
import Text from '@/app/components/text';
import DistributionSetModuleArtifacts from '../distribution-set-module-artifacts';

type DistributionSetModulesProps = {
  distributionSet: Distribution;
  onModuleDelete: (module: SoftwareModule) => void;
};

export default function DistributionSetModules({ distributionSet, onModuleDelete }: DistributionSetModulesProps) {
  const { modules } = distributionSet;
  const columnHelper = createColumnHelper<SoftwareModule>();
  const [expandedModuleId, setExpandedModuleId] = useState<number | undefined>(undefined);

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('typeName', {
        header: 'Type',
        size: 100,
      }),
      columnHelper.accessor('version', {
        header: 'Software Module',
        size: 220,
        cell: (cell) => `${cell.row.original.name}:${cell.row.original.version}`,
      }),
      columnHelper.display({
        id: 'actions',
        size: 80,
        cell: (cell) => (
          <ActionIconButtons>
            <TooltipIconButton
              icon={<ChevronDownIcon width={18} height={18} />}
              tooltipContent={expandedModuleId === cell.row.original.id ? 'Hide artifacts' : 'Show artifacts'}
              iconButtonProps={{
                onClick: () => setExpandedModuleId((current) => (current === cell.row.original.id ? undefined : cell.row.original.id)),
                'data-testid': `distribution-set-module-artifacts-toggle-${cell.row.original.id}`,
              }}
            />
            <TooltipIconButton icon={<TrashIcon />} tooltipContent='Unassign' iconButtonProps={{ onClick: () => onModuleDelete(cell.row.original) }} />
          </ActionIconButtons>
        ),
      }),
    ];
  }, [columnHelper, expandedModuleId, onModuleDelete]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <Text variant='heading-2'>Modules</Text>
      <Table
        columns={columns}
        data={modules}
        isRowExpanded={(module) => module.id === expandedModuleId}
        renderExpandedRow={(module) => <DistributionSetModuleArtifacts softwareModuleId={module.id} />}
      />
    </div>
  );
}
