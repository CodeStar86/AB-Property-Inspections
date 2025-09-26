import React from 'react';
import { Clock, Calendar } from 'lucide-react';
import { getCurrentBillingPeriod, formatBillingPeriod, getDaysRemainingInCurrentPeriod } from '../../utils/billingPeriods';

interface PeriodDisplayProps {
  showIcon?: boolean;
  showPeriodDates?: boolean;
  className?: string;
  compact?: boolean;
}

export function RealTimePeriodDisplay({ 
  showIcon = true, 
  showPeriodDates = true, 
  className = '',
  compact = false 
}: PeriodDisplayProps) {
  const currentPeriod = getCurrentBillingPeriod();
  const daysRemaining = getDaysRemainingInCurrentPeriod();

  const formatDaysRemaining = () => {
    if (daysRemaining <= 0) {
      return "Period has ended - Cashback/Commission reset!";
    }

    if (compact) {
      return `${daysRemaining}d`;
    }

    return `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`;
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {showPeriodDates && (
        <div className={`flex items-center gap-1 ${compact ? 'text-xs' : 'text-xs'} text-gray-500`}>
          {showIcon && <Calendar className="h-3 w-3" />}
          <span>Period: {formatBillingPeriod(currentPeriod)}</span>
        </div>
      )}
      <div className={`flex items-center gap-1 ${compact ? 'text-xs' : 'text-xs'} ${
        daysRemaining <= 0 ? 'text-red-600' : 
        daysRemaining <= 1 ? 'text-orange-600' : 
        'text-gray-500'
      }`}>
        {showIcon && <Clock className="h-3 w-3" />}
        <span className="font-medium">
          {daysRemaining <= 0 ? formatDaysRemaining() : formatDaysRemaining() + ' remaining'}
        </span>
      </div>
    </div>
  );
}