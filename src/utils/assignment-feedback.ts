import type { AssignmentResponse } from '@/services/targets-service.types';

export type AssignmentFeedback = {
  tone: 'success' | 'info';
  message: string;
};

const buildTargetDescription = (targetLabel?: string, total?: number): string => {
  if (targetLabel) {
    return targetLabel;
  }
  if (total && total > 1) {
    return `${total} targets`;
  }
  return 'the target';
};

export function buildAssignmentFeedback(result: AssignmentResponse | undefined, distributionName: string, targetLabel?: string): AssignmentFeedback {
  const assigned = result?.assigned ?? 0;
  const alreadyAssigned = result?.alreadyAssigned ?? 0;
  const total = result?.total ?? assigned + alreadyAssigned;
  const targetDescription = buildTargetDescription(targetLabel, total);

  if (assigned === 0) {
    if (alreadyAssigned > 0) {
      return {
        tone: 'info',
        message: `${distributionName} is already assigned to ${targetDescription}; nothing changed. Use Force reinstall to assign a byte-identical twin with a forced action.`,
      };
    }

    return {
      tone: 'info',
      message: `hawkBit did not create a new assignment for ${distributionName} on ${targetDescription}. The target may already be on this distribution set.`,
    };
  }

  if (alreadyAssigned > 0) {
    return {
      tone: 'success',
      message: `Assigned ${distributionName} to ${assigned} target(s); ${alreadyAssigned} already had it.`,
    };
  }

  return {
    tone: 'success',
    message: `Assigned ${distributionName} to ${targetDescription}.`,
  };
}
