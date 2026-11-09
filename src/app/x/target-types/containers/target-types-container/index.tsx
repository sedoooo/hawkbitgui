'use client';

import { useCallback } from 'react';
import { Modal } from '@/app/components/modal';
import ConfirmDeleteModal from '@/app/components/confirm-delete-modal';
import { useConfirmDialog, useModal } from '@/app/hooks';
import { TargetType } from '@/entities/target-type';
import { TargetsTypesService } from '@/services/targets-types-service';
import { useTargetTypesStore } from '@/stores/targets-types-store';
import { handleErrorWithToast } from '@/utils/handle-error-with-toast';
import { toast } from 'react-hot-toast';
import TargetTypesCard from '../../components/target-types-card';
import CreateTargetTypeFormContainer from '@/app/x/deployment/containers/create-target-type-form-container';
import EditTargetTypeFormContainer from '@/app/x/deployment/containers/edit-target-type-form-container';
import { useGetTargetTypes } from '../../hooks/use-get-target-types';
import { ExpandableCardProvider } from '@/app/components/card/expandable-card-context';

export default function TargetTypesContainer() {
  const { data: targetTypes, isLoading, refetch } = useGetTargetTypes();
  const setSelectedType = useTargetTypesStore((state) => state.setSelectedType);

  const createTypeModal = useModal();
  const editTypeModal = useModal();
  const deleteTypeDialog = useConfirmDialog<TargetType>();

  const handleCreateSuccess = useCallback(() => {
    createTypeModal.close();
    void refetch();
    toast.success('Target type created');
  }, [createTypeModal, refetch]);

  const handleEditSuccess = useCallback(() => {
    editTypeModal.close();
    void refetch();
    toast.success('Target type updated');
  }, [editTypeModal, refetch]);

  const handleEditClick = (targetType: TargetType) => {
    setSelectedType(targetType);
    editTypeModal.open();
  };

  const handleDeleteClick = (targetType: TargetType) => {
    if ((targetType.targetCount ?? 0) > 0) {
      toast.error(`Cannot delete "${targetType.name}": ${targetType.targetCount} target(s) still use this type`);
      return;
    }
    deleteTypeDialog.open(targetType, async () => {
      try {
        await TargetsTypesService.deleteType(targetType.id);
        await refetch();
        toast.success(`Target type "${targetType.name}" deleted`);
      } catch (error) {
        handleErrorWithToast(error, 'Failed to delete target type');
      }
    });
  };

  return (
    <ExpandableCardProvider>
      <TargetTypesCard
        targetTypes={targetTypes ?? []}
        isLoading={isLoading}
        onCreateClick={createTypeModal.open}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
      />

      {createTypeModal.isOpen && (
        <Modal isOpen={createTypeModal.isOpen} onClose={createTypeModal.close}>
          <Modal.Header>Create new target type</Modal.Header>
          <Modal.Content>
            <CreateTargetTypeFormContainer onSubmitSuccess={handleCreateSuccess} onCancel={createTypeModal.close} />
          </Modal.Content>
        </Modal>
      )}

      {editTypeModal.isOpen && (
        <Modal isOpen={editTypeModal.isOpen} onClose={editTypeModal.close}>
          <Modal.Header>Edit target type</Modal.Header>
          <Modal.Content>
            <EditTargetTypeFormContainer onSubmitSuccess={handleEditSuccess} onCancel={editTypeModal.close} />
          </Modal.Content>
        </Modal>
      )}

      {deleteTypeDialog.isOpen && (
        <ConfirmDeleteModal isOpen={deleteTypeDialog.isOpen} onConfirm={deleteTypeDialog.confirm} onClose={deleteTypeDialog.close}>
          <ConfirmDeleteModal.Message>
            Are you sure you want to delete target type <span style={{ fontWeight: 'bold' }}>{deleteTypeDialog.data?.name}</span>?
          </ConfirmDeleteModal.Message>
        </ConfirmDeleteModal>
      )}
    </ExpandableCardProvider>
  );
}
