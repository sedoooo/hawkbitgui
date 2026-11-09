'use client';

import { useEffect, useState } from 'react';
import { useTargetTypesStore } from '@/stores/targets-types-store';
import TargetTypeForm from '@/app/x/deployment/components/target-type-form';
import { TargetsTypesService } from '@/services/targets-types-service';
import type { DistributionSetType } from '@/entities/distribution-set-type';
import { useGetDistributionSetTypes } from '@/app/x/distribution-set-types/hooks/use-get-distribution-set-types';
import { handleErrorWithToast } from '@/utils/handle-error-with-toast';

export interface EditTargetTagFormContainerProps {
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export default function EditTargetTypeFormContainer({ onSubmitSuccess, onCancel }: EditTargetTagFormContainerProps) {
  const fetchAllTypes = useTargetTypesStore((state) => state.fetchAllTypes);
  const selectedType = useTargetTypesStore((state) => state.selectedType);
  const { data: distributionSetTypes, isLoading: distributionSetTypesLoading } = useGetDistributionSetTypes();
  const [compatibleDistributionSetTypes, setCompatibleDistributionSetTypes] = useState<DistributionSetType[]>([]);

  useEffect(() => {
    if (!selectedType) {
      return;
    }
    TargetsTypesService.fetchCompatibleDistributionSetTypes(selectedType.id)
      .then(setCompatibleDistributionSetTypes)
      .catch((error) => handleErrorWithToast(error, 'Failed to load compatible distribution set types'));
  }, [selectedType]);

  const handleSubmit = async (data: {
    name: string;
    key: string;
    description: string;
    color?: string;
    compatibleDistributionSetTypes?: DistributionSetType[];
  }) => {
    if (!selectedType) return;
    await TargetsTypesService.updateType({
      id: selectedType.id,
      name: data.name,
      description: data.description,
      colour: data.color,
      compatibleDistributionSetTypes: data.compatibleDistributionSetTypes,
    });
    await fetchAllTypes();
    onSubmitSuccess?.();
  };

  if (!selectedType) {
    return null;
  }

  return (
    <TargetTypeForm
      onSubmit={handleSubmit}
      mode={'edit'}
      onCancel={onCancel}
      distributionSetTypes={distributionSetTypes}
      distributionSetTypesLoading={distributionSetTypesLoading}
      defaultValues={{
        ...selectedType,
        color: selectedType.colour,
        compatibleDistributionSetTypes,
      }}
    />
  );
}
