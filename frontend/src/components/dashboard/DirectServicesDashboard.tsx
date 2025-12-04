import { useState, useEffect } from 'react';
import { KPICard } from './KPICard';
import { Phone, Users2, Video, MessageCircle, Loader2, ChevronDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { apiClient } from '@/lib/apiClient';
import { FiscalYear } from '@/lib/fiscalYear';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DirectServicesProps {
  peerSupport: number;
  webinars: number;
  selectedYear: FiscalYear;
}

export function DirectServicesDashboard({ peerSupport, webinars, selectedYear }: DirectServicesProps) {
  const [supportCalls, setSupportCalls] = useState(0);
  const [staffList, setStaffList] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [callsByStaff, setCallsByStaff] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Fetch support calls data
  const fetchSupportCalls = async (staffFilter?: string[]) => {
    setIsLoading(true);
    try {
      const data = await apiClient.queryContactNotes('query-support-calls', {
        fiscalYearStart: selectedYear.startDate.toISOString(),
        fiscalYearEnd: selectedYear.endDate.toISOString(),
        selectedStaff: staffFilter,
      });

      if (data?.success) {
        setSupportCalls(data.totalCalls || 0);
        setCallsByStaff(data.callsByStaff || {});
        
        // Only set staff list on initial load
        if (isInitialLoad && data.staffList) {
          setStaffList(data.staffList);
          setIsInitialLoad(false);
        }
      }
    } catch (err) {
      console.error('Failed to fetch support calls:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load on mount and fiscal year change
  useEffect(() => {
    setIsInitialLoad(true);
    fetchSupportCalls();
  }, [selectedYear]);

  // Recalculate when staff selection changes
  useEffect(() => {
    if (!isInitialLoad) {
      // Calculate locally from callsByStaff instead of re-fetching
      if (selectedStaff.length > 0) {
        const total = selectedStaff.reduce((sum, staff) => sum + (callsByStaff[staff] || 0), 0);
        setSupportCalls(total);
      } else {
        // Show all calls if none selected
        const total = Object.values(callsByStaff).reduce((sum, count) => sum + count, 0);
        setSupportCalls(total);
      }
    }
  }, [selectedStaff, callsByStaff, isInitialLoad]);

  const handleStaffToggle = (staff: string) => {
    setSelectedStaff(prev => 
      prev.includes(staff)
        ? prev.filter(s => s !== staff)
        : [...prev, staff]
    );
  };

  const handleSelectAll = () => {
    setSelectedStaff(staffList);
  };

  const handleClearAll = () => {
    setSelectedStaff([]);
  };

  const totalEngagements = supportCalls + peerSupport + webinars;
  
  const pieData = [
    { name: 'Support Calls', value: supportCalls, color: 'hsl(175, 65%, 35%)' },
    { name: 'Peer-to-Peer', value: peerSupport, color: 'hsl(38, 92%, 50%)' },
    { name: 'Webinars', value: webinars, color: 'hsl(262, 60%, 55%)' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Staff Filter - Collapsible */}
      <Collapsible defaultOpen={false} className="chart-container animate-fade-in">
        <div className="flex items-center justify-between">
          <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">Staff Filter for Support Calls</h3>
              <p className="text-sm text-muted-foreground text-left">
                {selectedStaff.length > 0 ? `${selectedStaff.length} selected` : 'Showing all calls'}
              </p>
            </div>
          </CollapsibleTrigger>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              Clear All
            </Button>
          </div>
        </div>
        
        <CollapsibleContent className="mt-4">
          {isLoading && isInitialLoad ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading staff list...</span>
            </div>
          ) : staffList.length > 0 ? (
            <ScrollArea className="h-40 rounded-md border p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {staffList.map((staff) => (
                  <div key={staff} className="flex items-center space-x-2">
                    <Checkbox
                      id={`staff-${staff}`}
                      checked={selectedStaff.includes(staff)}
                      onCheckedChange={() => handleStaffToggle(staff)}
                    />
                    <Label 
                      htmlFor={`staff-${staff}`} 
                      className="text-sm cursor-pointer flex-1"
                    >
                      {staff}
                      <span className="text-muted-foreground ml-1">
                        ({callsByStaff[staff] || 0})
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No staff data available. Contact notes may not have any "Call" type entries.
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* KPI Row */}
      <div className="dashboard-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Direct Services"
          value={isLoading ? '...' : totalEngagements}
          subtitle="All service interactions"
          icon={MessageCircle}
          variant="primary"
        />
        <KPICard
          title="Support Calls"
          value={isLoading ? '...' : supportCalls}
          subtitle={selectedStaff.length > 0 ? `From ${selectedStaff.length} staff` : 'All staff calls'}
          icon={Phone}
        />
        <KPICard
          title="Peer-to-Peer Support"
          value={peerSupport}
          subtitle="Family connections"
          icon={Users2}
        />
        <KPICard
          title="Webinars Attended"
          value={webinars}
          subtitle="Educational sessions"
          icon={Video}
        />
      </div>

      {/* Engagement Breakdown Chart */}
      <div className="chart-container animate-fade-in">
        <h3 className="text-xl font-semibold text-foreground mb-6">Engagement Breakdown</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Pie Chart */}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(0, 0%, 100%)', 
                    border: '1px solid hsl(210, 20%, 90%)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [value.toLocaleString(), 'Engagements']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend - Separate */}
          <div className="space-y-4">
            {pieData.map((entry, index) => {
              const percentage = totalEngagements > 0 ? ((entry.value / totalEngagements) * 100).toFixed(1) : 0;
              return (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="font-bold text-foreground">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-foreground">{entry.value.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground ml-2">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Staff Breakdown Table - Collapsible */}
      {Object.keys(callsByStaff).length > 0 && (
        <Collapsible defaultOpen={true} className="chart-container animate-fade-in">
          <CollapsibleTrigger className="flex items-center gap-2 w-full hover:opacity-80 transition-opacity">
            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180" />
            <h3 className="text-xl font-semibold text-foreground">Support Calls by Staff</h3>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Staff Member</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Calls</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(callsByStaff)
                    .sort(([, a], [, b]) => b - a)
                    .map(([staff, count]) => {
                      const allCallsTotal = Object.values(callsByStaff).reduce((s, c) => s + c, 0);
                      const percentage = allCallsTotal > 0 ? ((count / allCallsTotal) * 100).toFixed(1) : 0;
                      const isSelected = selectedStaff.length === 0 || selectedStaff.includes(staff);
                      return (
                        <tr 
                          key={staff} 
                          className={`border-b border-border/50 ${isSelected ? '' : 'opacity-40'}`}
                        >
                          <td className="py-3 px-4 text-foreground">{staff}</td>
                          <td className="py-3 px-4 text-right font-semibold text-foreground">{count}</td>
                          <td className="py-3 px-4 text-right text-muted-foreground">{percentage}%</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
