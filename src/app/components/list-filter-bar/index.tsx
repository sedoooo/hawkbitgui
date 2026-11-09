'use client';

import type React from 'react';
import styles from './styles.module.scss';
import Select from '../select';
import Input from '../input';
import Button from '../button';
import type { ListFilterOption, ListFilterState } from '@/utils/list-filters';

export type ListFilterBarProps = {
  filters: ListFilterState;
  typeOptions?: ListFilterOption[];
  showType?: boolean;
  typeLabel?: string;
  dateLabel?: string;
  onChange: (filters: ListFilterState) => void;
  onReset: () => void;
  testIdPrefix?: string;
};

export default function ListFilterBar({
  filters,
  typeOptions = [],
  showType = true,
  typeLabel = 'Type',
  dateLabel = 'Created',
  onChange,
  onReset,
  testIdPrefix = 'list-filter',
}: ListFilterBarProps) {
  const update = (patch: Partial<ListFilterState>) => {
    onChange({ ...filters, ...patch });
  };

  return (
    <div className={styles.bar} data-testid={`${testIdPrefix}-bar`}>
      {showType && (
        <label className={styles.field}>
          <span className={styles.label}>{typeLabel}</span>
          <Select
            aria-label={`Filter by ${typeLabel.toLowerCase()}`}
            data-testid={`${testIdPrefix}-type`}
            value={filters.type}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => update({ type: event.target.value })}
          >
            <option value=''>All</option>
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
      )}
      <label className={styles.field}>
        <span className={styles.label}>{dateLabel} from</span>
        <Input
          aria-label={`Filter ${dateLabel.toLowerCase()} from date`}
          data-testid={`${testIdPrefix}-date-from`}
          type='date'
          max={filters.dateTo || undefined}
          value={filters.dateFrom}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => update({ dateFrom: event.target.value })}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>{dateLabel} to</span>
        <Input
          aria-label={`Filter ${dateLabel.toLowerCase()} to date`}
          data-testid={`${testIdPrefix}-date-to`}
          type='date'
          min={filters.dateFrom || undefined}
          value={filters.dateTo}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => update({ dateTo: event.target.value })}
        />
      </label>
      <div className={styles.reset} data-testid={`${testIdPrefix}-reset`}>
        <Button variant='outline' onClick={onReset}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
