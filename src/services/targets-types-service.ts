import { TargetType } from '@/entities';
import type { DistributionSetType } from '@/entities/distribution-set-type';
import axiosInstance from '@/lib/axios';
import { CreateTypeInput, GetTargetsTypesResponse, UpdateTypeInput } from '@/services/targets-types-service.types';
import { ApiResponse } from '@/services/types';
import {
  buildTargetTypeCreatePayload,
  buildTargetTypeUpdatePayload,
  diffCompatibleDistributionSetTypeIds,
  normalizeCompatibilityInput,
} from '@/utils/target-types';

export class TargetsTypesService {
  static async createType(input: CreateTypeInput): Promise<void> {
    try {
      await axiosInstance.post<TargetType[]>(`/targettypes`, [buildTargetTypeCreatePayload(input)]);
    } catch (error) {
      console.error('Failed to create Type', error);
      throw error;
    }
  }

  static async fetchTargetsTypes(): Promise<TargetType[]> {
    try {
      const response = await axiosInstance.get<GetTargetsTypesResponse>(`/targettypes`, {
        params: { limit: 1000 },
      });
      return response.data.content;
    } catch (error) {
      console.error('Failed to fetch targets types', error);
      throw error;
    }
  }

  static async fetchCompatibleDistributionSetTypes(targetTypeId: string | number): Promise<DistributionSetType[]> {
    try {
      const response = await axiosInstance.get<DistributionSetType[]>(`/targettypes/${targetTypeId}/compatibledistributionsettypes`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch compatible distribution set types', error);
      throw error;
    }
  }

  static async fetchTargetCountForType(targetTypeId: number): Promise<number> {
    try {
      const response = await axiosInstance.get<ApiResponse<unknown[]>>(`/targets`, {
        params: {
          q: `targetType.id==${targetTypeId}`,
          limit: 1,
        },
      });
      return response.data.total ?? 0;
    } catch (error) {
      console.error('Failed to fetch target count for target type', error);
      throw error;
    }
  }

  static async fetchTargetTypesDetailed(): Promise<TargetType[]> {
    const targetTypes = await TargetsTypesService.fetchTargetsTypes();

    return Promise.all(
      targetTypes.map(async (targetType) => {
        const [compatibleDistributionSetTypes, targetCount] = await Promise.all([
          TargetsTypesService.fetchCompatibleDistributionSetTypes(targetType.id).catch(() => [] as DistributionSetType[]),
          TargetsTypesService.fetchTargetCountForType(targetType.id).catch(() => 0),
        ]);

        return { ...targetType, compatibleDistributionSetTypes, targetCount };
      })
    );
  }

  static async deleteType(id: string | number): Promise<void> {
    try {
      await axiosInstance.delete(`/targettypes/${id}`);
    } catch (error) {
      console.error('Failed to delete Type', error);
      throw error;
    }
  }

  static async updateType(input: UpdateTypeInput): Promise<void> {
    try {
      const currentCompatibleTypes =
        input.compatibleDistributionSetTypes !== undefined ? await TargetsTypesService.fetchCompatibleDistributionSetTypes(input.id) : undefined;

      await axiosInstance.put(`/targettypes/${input.id}`, buildTargetTypeUpdatePayload(input));

      if (currentCompatibleTypes && input.compatibleDistributionSetTypes !== undefined) {
        const currentIds = currentCompatibleTypes.map((type) => type.id);
        const nextIds = normalizeCompatibilityInput(input.compatibleDistributionSetTypes).map((type) => type.id);
        const { added, removed } = diffCompatibleDistributionSetTypeIds(currentIds, nextIds);

        if (added.length > 0) {
          await axiosInstance.post(
            `/targettypes/${input.id}/compatibledistributionsettypes`,
            added.map((id) => ({ id }))
          );
        }

        for (const distributionSetTypeId of removed) {
          await axiosInstance.delete(`/targettypes/${input.id}/compatibledistributionsettypes/${distributionSetTypeId}`);
        }
      }
    } catch (error) {
      console.error('Failed to update type', error);
      throw error;
    }
  }
}
