import { describe, expect, test } from 'bun:test';
import { buildAssignmentFeedback } from '../src/utils/assignment-feedback';

describe('buildAssignmentFeedback', () => {
  test('reports a fresh assignment as a success', () => {
    const feedback = buildAssignmentFeedback({ assigned: 1, alreadyAssigned: 0, total: 1 }, 'gw-release', 'target fota-dk2-01');

    expect(feedback.tone).toBe('success');
    expect(feedback.message).toContain('Assigned gw-release');
    expect(feedback.message).toContain('fota-dk2-01');
  });

  test('explains that assigning the same distribution set changed nothing', () => {
    const feedback = buildAssignmentFeedback({ assigned: 0, alreadyAssigned: 1, total: 1 }, 'gw-release', 'target fota-dk2-01');

    expect(feedback.tone).toBe('info');
    expect(feedback.message).toContain('already assigned');
    expect(feedback.message).toContain('Force reinstall');
  });

  test('summarizes partial multi-target assignments', () => {
    const feedback = buildAssignmentFeedback({ assigned: 2, alreadyAssigned: 1, total: 3 }, 'gw-release', '3 targets');

    expect(feedback.tone).toBe('success');
    expect(feedback.message).toContain('2 target(s)');
    expect(feedback.message).toContain('1 already had it');
  });

  test('explains an empty response instead of reporting silence', () => {
    const feedback = buildAssignmentFeedback({ assigned: 0, alreadyAssigned: 0, total: 0 }, 'gw-release', 'target fota-dk2-01');

    expect(feedback.tone).toBe('info');
    expect(feedback.message).toContain('did not create a new assignment');
  });
});
