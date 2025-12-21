import { Badge } from '@/components/ui/badge';
import { CustomerTier } from '@/lib/types';
import { getTierColor } from '@/lib/helpers';

interface TierBadgeProps {
  tier: CustomerTier;
}

export function TierBadge({ tier }: TierBadgeProps) {
  return (
    <Badge 
      variant="secondary" 
      className={`${getTierColor(tier)} font-medium text-xs capitalize rounded-full`}
    >
      {tier}
    </Badge>
  );
}
