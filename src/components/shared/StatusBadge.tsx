import { Badge } from '@/components/ui/badge';
import { OrderStatus } from '@/lib/types';
import { getStatusColor } from '@/lib/helpers';

interface StatusBadgeProps {
  status: OrderStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge 
      variant="secondary" 
      className={`${getStatusColor(status)} font-medium text-xs uppercase tracking-wide rounded-full`}
    >
      {status}
    </Badge>
  );
}
