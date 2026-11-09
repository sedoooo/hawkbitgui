import { PageWrapper } from '@/app/components/page-wrapper';
import TargetTypesContainer from './containers/target-types-container';

export default function TargetTypesPage() {
  return (
    <PageWrapper>
      <PageWrapper.Title>Target Types Management</PageWrapper.Title>
      <TargetTypesContainer />
    </PageWrapper>
  );
}
