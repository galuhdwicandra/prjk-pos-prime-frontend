// src/components/customers/CustomerStageBadge.tsx
import { memo } from 'react';
import type { CustomerStage } from '../../types/customers';

type StageInfo = { label: string; className: string };

const STAGE_INFO: Record<CustomerStage, StageInfo> = {
  LEAD:   { label: 'Lead',   className: 'badge badge-warning' },
  ACTIVE: { label: 'Active', className: 'badge badge-success' },
  CHURN:  { label: 'Churn',  className: 'badge badge-danger' },
} as const;

interface Props {
  stage: CustomerStage;
}

function CustomerStageBadge({ stage }: Props) {
  const info = STAGE_INFO[stage]; // terjamin valid oleh tipe
  return <span className={info.className}>{info.label}</span>;
}

export default memo(CustomerStageBadge);
