'use client';

import Card from '@/app/components/card';
import Button from '@/app/components/button';
import IconButton from '@/app/components/icon-button';
import SearchIcon from '@/app/components/icons/search-icon';
import RolloutsTableContainer from '../../containers/rollouts-table-container';
import PlusIcon from '@/app/components/icons/plus-icon';
import { Modal } from '@/app/components/modal';
import { useState } from 'react';
import { useRolloutsPageStore } from '@/stores/rollouts-page-store';
import RolloutDetailsTableContainer from '../../containers/rollout-details-table-container';
import { RolloutsDetailsCardHeader } from '../rollouts-details-card-header';
import RolloutDeployGroupDetailsContainer from '../../containers/rollout-deploy-group-details-container';
import { RolloutsDeployGroupTargetDetailsCardHeader } from '../rollout-deploy-group-target-details-header';
import CreateRolloutFormContainer from '../../containers/create-rollout-form-container';
import StaticCard from '@/app/components/static-card';
import ManageColumnsButton from '@/app/components/manage-columns-button';
import { ROLLOUTS_TABLE_VISIBLE_COLUMNS_STORAGE_KEY, useRolloutsTableStore } from '@/stores/rollouts-table-store';
import { ROLLOUT_DEPLOY_GROUPS_TABLE_VISIBLE_COLUMNS_STORAGE_KEY, useRolloutDeployGroupsTableStore } from '@/stores/rollout-deploy-groups-table-store';
import {
  ROLLOUT_DEPLOY_GROUP_TARGETS_TABLE_VISIBLE_COLUMNS_STORAGE_KEY,
  useRolloutDeployGroupTargetsTableStore,
} from '@/stores/rollout-deploy-group-targets-table-store';

export default function RolloutsCard() {
  const [isCreateRolloutFormOpen, setIsCreateRolloutFormOpen] = useState(false);
  const selectedRollout = useRolloutsPageStore((state) => state.selectedRollout);
  const selectedDeployGroup = useRolloutsPageStore((state) => state.selectedDeployGroup);
  const tableType = useRolloutsPageStore((state) => state.tableType);
  const rolloutsVisibleColumns = useRolloutsTableStore((state) => state.visibleColumns);
  const setRolloutsVisibleColumns = useRolloutsTableStore((state) => state.setVisibleColumns);
  const deployGroupsVisibleColumns = useRolloutDeployGroupsTableStore((state) => state.visibleColumns);
  const setDeployGroupsVisibleColumns = useRolloutDeployGroupsTableStore((state) => state.setVisibleColumns);
  const deployGroupTargetsVisibleColumns = useRolloutDeployGroupTargetsTableStore((state) => state.visibleColumns);
  const setDeployGroupTargetsVisibleColumns = useRolloutDeployGroupTargetsTableStore((state) => state.setVisibleColumns);
  const setTableType = useRolloutsPageStore((state) => state.setTableType);

  const activeColumns =
    tableType === 'deploy-groups'
      ? {
          columns: deployGroupsVisibleColumns,
          setVisibleColumns: setDeployGroupsVisibleColumns,
          storageKey: ROLLOUT_DEPLOY_GROUPS_TABLE_VISIBLE_COLUMNS_STORAGE_KEY,
        }
      : tableType === 'deploy-group-targets'
        ? {
            columns: deployGroupTargetsVisibleColumns,
            setVisibleColumns: setDeployGroupTargetsVisibleColumns,
            storageKey: ROLLOUT_DEPLOY_GROUP_TARGETS_TABLE_VISIBLE_COLUMNS_STORAGE_KEY,
          }
        : {
            columns: rolloutsVisibleColumns,
            setVisibleColumns: setRolloutsVisibleColumns,
            storageKey: ROLLOUTS_TABLE_VISIBLE_COLUMNS_STORAGE_KEY,
          };

  const openForm = () => {
    setIsCreateRolloutFormOpen(true);
  };

  const closeForm = () => {
    setIsCreateRolloutFormOpen(false);
  };

  return (
    <>
      <StaticCard>
        <StaticCard.Header>
          <StaticCard.Title>
            {tableType === 'rollouts' && 'Rollouts'}
            {tableType === 'deploy-groups' && selectedRollout && (
              <RolloutsDetailsCardHeader rolloutName={selectedRollout.name} onRolloutsClick={() => setTableType({ tableType: 'rollouts' })} />
            )}
            {tableType === 'deploy-group-targets' && selectedRollout && selectedDeployGroup && (
              <RolloutsDeployGroupTargetDetailsCardHeader
                rolloutName={selectedRollout.name}
                deployGroupName={selectedDeployGroup.name}
                onRolloutsClick={() => setTableType({ tableType: 'rollouts' })}
                onDeployGroupNameClick={() => setTableType({ tableType: 'deploy-groups', selectedRollout: selectedRollout })}
              />
            )}
          </StaticCard.Title>
          <StaticCard.Actions>
            <IconButton width='30px' height='30px'>
              <SearchIcon />
            </IconButton>
            <Button leftIcon={<PlusIcon width={18} height={18} />} onClick={openForm}>
              Create new rollout
            </Button>
            <ManageColumnsButton columns={activeColumns.columns} setVisibleColumns={activeColumns.setVisibleColumns} storageKey={activeColumns.storageKey} />
          </StaticCard.Actions>
        </StaticCard.Header>
        <Card.Body>
          {tableType === 'rollouts' && <RolloutsTableContainer />}
          {tableType === 'deploy-groups' && selectedRollout && <RolloutDetailsTableContainer />}
          {tableType === 'deploy-group-targets' && selectedRollout && selectedDeployGroup && <RolloutDeployGroupDetailsContainer />}
        </Card.Body>
      </StaticCard>
      <Modal size='xl' isOpen={isCreateRolloutFormOpen} onClose={closeForm}>
        <Modal.Header>Create new rollout</Modal.Header>
        <Modal.Content>
          <div style={{ maxHeight: '82vh', overflow: 'auto' }}>
            <CreateRolloutFormContainer onSubmitSuccess={closeForm} onCancel={closeForm} />
          </div>
        </Modal.Content>
      </Modal>
    </>
  );
}
