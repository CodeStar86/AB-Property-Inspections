import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar, Clock, TrendingUp, Users } from 'lucide-react';
import { 
  getCurrentBillingPeriod, 
  formatBillingPeriod, 
  getTimeRemainingInCurrentPeriod,
  getPastBillingPeriods,
  isDateInBillingPeriod 
} from '../../utils/billingPeriods';
import { RealTimePeriodDisplay } from './RealTimePeriodDisplay';
import { useApp } from '../../context/AppContext';

interface PeriodOverviewProps {
  showPastPeriods?: boolean;
  userRole?: 'agent' | 'clerk' | 'admin';
}

export function PeriodOverview({ showPastPeriods = false, userRole = 'admin' }: PeriodOverviewProps) {
  const { state } = useApp();
  const [currentPeriod, setCurrentPeriod] = useState(getCurrentBillingPeriod());
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemainingInCurrentPeriod());

  useEffect(() => {
    const updateData = () => {
      const newPeriod = getCurrentBillingPeriod();
      const newTimeRemaining = getTimeRemainingInCurrentPeriod();
      
      setCurrentPeriod(newPeriod);
      setTimeRemaining(newTimeRemaining);
    };

    updateData();
    const interval = setInterval(updateData, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate current period statistics
  const currentPeriodInspections = state.inspections
    .filter(i => i.status === 'completed')
    .filter(i => isDateInBillingPeriod(new Date(i.completedDate || i.scheduledDate), currentPeriod));

  const currentPeriodRevenue = currentPeriodInspections.reduce((sum, i) => sum + i.price, 0);
  const currentPeriodCashback = currentPeriodRevenue * 0.15;
  const currentPeriodCommissions = currentPeriodRevenue * 0.30;

  // Get unique agents and clerks who worked in this period
  const currentPeriodAgents = new Set(currentPeriodInspections.map(i => i.agentId)).size;
  const currentPeriodClerks = new Set(currentPeriodInspections.map(i => i.clerkId).filter(Boolean)).size;

  const pastPeriods = showPastPeriods ? getPastBillingPeriods(3) : [];

  const calculatePeriodStats = (periodStart: Date, periodEnd: Date) => {
    const periodInspections = state.inspections
      .filter(i => i.status === 'completed')
      .filter(i => {
        const inspectionDate = new Date(i.completedDate || i.scheduledDate);
        return inspectionDate >= periodStart && inspectionDate <= periodEnd;
      });

    const revenue = periodInspections.reduce((sum, i) => sum + i.price, 0);
    return {
      inspections: periodInspections.length,
      revenue,
      cashback: revenue * 0.15,
      commissions: revenue * 0.30,
      agents: new Set(periodInspections.map(i => i.agentId)).size,
      clerks: new Set(periodInspections.map(i => i.clerkId).filter(Boolean)).size
    };
  };

  return (
    <div className="space-y-6">
      {/* Current Period */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Current Billing Period
            <Badge variant="secondary" className="ml-auto">
              Period #{currentPeriod.periodNumber}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Inspections</p>
              <p className="text-xl font-bold text-gray-900">{currentPeriodInspections.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-xl font-bold text-gray-900">£{currentPeriodRevenue.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Active Agents</p>
              <p className="text-xl font-bold text-gray-900">{currentPeriodAgents}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Active Clerks</p>
              <p className="text-xl font-bold text-gray-900">{currentPeriodClerks}</p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <RealTimePeriodDisplay showIcon={true} showPeriodDates={true} />
          </div>
        </CardContent>
      </Card>

      {/* Past Periods (if enabled) */}
      {showPastPeriods && pastPeriods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              Recent Periods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastPeriods.map((period) => {
                const stats = calculatePeriodStats(period.start, period.end);
                return (
                  <div key={period.periodNumber} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        Period #{period.periodNumber}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {formatBillingPeriod(period)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Inspections</p>
                        <p className="font-semibold">{stats.inspections}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Revenue</p>
                        <p className="font-semibold">£{stats.revenue.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Agents</p>
                        <p className="font-semibold">{stats.agents}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Clerks</p>
                        <p className="font-semibold">{stats.clerks}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}