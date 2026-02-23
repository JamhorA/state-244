import type { ApplicationStatus } from '@/types';

interface StatusBadgeProps {
  status: ApplicationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig: Record<ApplicationStatus, { label: string; bgColor: string; textColor: string }> = {
    submitted: {
      label: 'Submitted',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
    },
    reviewing: {
      label: 'Reviewing',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
    },
    approved: {
      label: 'Approved',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
    },
    rejected: {
      label: 'Rejected',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
    },
  };

  const config = statusConfig[status] || statusConfig.submitted;

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
      {config.label}
    </span>
  );
}
