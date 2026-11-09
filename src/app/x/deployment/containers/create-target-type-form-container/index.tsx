'use client';

import TargetTypeForm from '@/app/x/deployment/components/target-type-form';
import { useTargetTypesStore } from '@/stores/targets-types-store';
import { TargetsTypesService } from '@/services/targets-types-service';
import { useGetDistributionSetTypes } from '@/app/x/distribution-set-types/hooks/use-get-distribution-set-types';

export interface CreateTargetTagFormContainerProps {
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateTargetTypeFormContainer({ onSubmitSuccess, onCancel }: CreateTargetTagFormContainerProps) {
  const fetchAllTypes = useTargetTypesStore((state) => state.fetchAllTypes);
  const { data: distributionSetTypes, isLoading: distributionSetTypesLoading } = useGetDistributionSetTypes();

  const handleSubmit = async (data: { name: string; key: string; description: string; color?: string; compatibleDistributionSetTypes?: { id: number }[] }) => {
    await TargetsTypesService.createType({
      name: data.name,
      key: data.key,
      description: data.description,
      colour: data.color,
      compatibleDistributionSetTypes: data.compatibleDistributionSetTypes,
    });
    await fetchAllTypes();
    onSubmitSuccess?.();
  };

  return (
    <TargetTypeForm
      onSubmit={handleSubmit}
      mode={'create'}
      onCancel={onCancel}
      distributionSetTypes={distributionSetTypes}
      distributionSetTypesLoading={distributionSetTypesLoading}
    />
  );
}
