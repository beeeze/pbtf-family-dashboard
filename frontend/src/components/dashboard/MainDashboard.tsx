import { useState, useEffect } from 'react';
import { KPICard } from './KPICard';
import { EngagementChart } from './EngagementChart';
import { SupportTypeChart } from './SupportTypeChart';
import { MonthlyTrendChart } from './MonthlyTrendChart';
import { YearOverYearChart } from './YearOverYearChart';
import { Users, UserCheck, UserPlus, Activity, Heart, RefreshCcw, TrendingUp } from 'lucide-react';

interface CustomWidget {
  id: string;
  title: string;
  engagementType: string;
  value: number;
  subtitle: string;
}

interface MonthlyData {
  month: string;
  butterflyFund: number;
  uberProgram: number;
  rideForKids: number;
  peerSupport: number;
  webinars: number;
  other: number;
  newFamilies: number;
  newlyDiagnosed: number;
  totalEngagements: number;
}

interface YoYData {
  fiscalYear: string;
  engaged: number;
  newlyDiagnosed: number;
  newFamilies: number;
  firstTimeEngaged: number;
  reEngaged: number;
  totalEngagements: number;
}

interface DashboardMetrics {
  totalFamilies: number;
  totalInFiscalYear: number;
  engagedCount: number;
  notEngagedCount: number;
  newlyDiagnosedCount: number;
  totalInteractions: number;
  familiesReached: number;
  newFamiliesCount: number;
  firstTimeEngagedCount: number;
  reEngagedCount: number;
  supportTypes: {
    butterflyFund: number;
    uberProgram: number;
    rideForKids: number;
    peerSupport: number;
    webinars: number;
  };
  supportCalls: number;
  monthlyData: MonthlyData[];
}

interface MainDashboardProps {
  metrics: DashboardMetrics;
  yoyData?: YoYData[];
  isLoadingYoY?: boolean;
}

export function MainDashboard({ metrics, yoyData, isLoadingYoY }: MainDashboardProps) {
  const [customWidgets, setCustomWidgets] = useState<CustomWidget[]>([]);

  // Load custom widgets from localStorage
  useEffect(() => {
    const loadWidgets = () => {
      const savedWidgets = localStorage.getItem('customWidgets');
      if (savedWidgets) {
        try {
          setCustomWidgets(JSON.parse(savedWidgets));
        } catch (err) {
          console.error('Failed to load custom widgets:', err);
        }
      }
    };

    loadWidgets();

    // Listen for storage changes (when widgets are added/removed)
    const handleStorageChange = () => {
      loadWidgets();
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event for same-tab updates
    window.addEventListener('customWidgetsUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('customWidgetsUpdated', handleStorageChange);
    };
  }, []);

  const engagementRate = metrics.totalFamilies > 0 
    ? ((metrics.engagedCount / metrics.totalFamilies) * 100).toFixed(1) 
    : '0';

  return (
    <div className="space-y-6">
      {/* Top KPI Row */}
      <div className="dashboard-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Families in Fiscal Year"
          value={metrics.totalInFiscalYear}
          subtitle="Created within selected fiscal year"
          icon={Users}
          variant="primary"
        />
        <KPICard
          title="Families Engaged"
          value={metrics.engagedCount}
          subtitle={`${engagementRate}% engagement rate`}
          icon={UserCheck}
        />
        <KPICard
          title="Newly Diagnosed"
          value={metrics.newlyDiagnosedCount}
          subtitle="This fiscal year"
          icon={UserPlus}
          variant="accent"
        />
        <KPICard
          title="Total Interactions"
          value={metrics.totalInteractions}
          subtitle="Family engagements"
          icon={Activity}
        />
      </div>

      {/* Engagement Widgets Row - Blend custom widgets with locked ones */}
      <div className="dashboard-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Butterfly Fund"
          value={metrics.supportTypes.butterflyFund}
          subtitle="Financial assistance"
          icon={Heart}
          variant="primary"
        />
        <KPICard
          title="Uber Program"
          value={metrics.supportTypes.uberProgram}
          subtitle="Transportation support"
          icon={Activity}
        />
        <KPICard
          title="Ride for Kids"
          value={metrics.supportTypes.rideForKids}
          subtitle="Ride services"
          icon={Users}
        />
        {/* Dynamically add custom widgets here */}
        {customWidgets.map((widget) => (
          <KPICard
            key={widget.id}
            title={widget.title}
            value={widget.value}
            subtitle={widget.subtitle}
            icon={TrendingUp}
            variant="accent"
          />
        ))}
      </div>

      {/* Engagement & Support Row */}
      <div className="dashboard-grid grid-cols-1 lg:grid-cols-2">
        <EngagementChart 
          engaged={metrics.engagedCount} 
          notEngaged={metrics.notEngagedCount} 
        />
        <SupportTypeChart supportTypes={metrics.supportTypes} customWidgets={customWidgets} />
      </div>

      {/* New Families & Engagement Types Row */}
      <div className="dashboard-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="New Families"
          value={metrics.newFamiliesCount}
          subtitle="Created & engaged in FY"
          icon={UserPlus}
        />
        <KPICard
          title="First Time Engaged"
          value={metrics.firstTimeEngagedCount}
          subtitle="First engagement ever this FY"
          icon={UserCheck}
        />
        <KPICard
          title="Re-engaged"
          value={metrics.reEngagedCount}
          subtitle="Previously engaged, active in FY"
          icon={RefreshCcw}
        />
        <KPICard
          title="Families Reached"
          value={metrics.familiesReached}
          subtitle="Unique contacts engaged"
          icon={Heart}
        />
      </div>

      {/* Monthly Trend */}
      <MonthlyTrendChart data={metrics.monthlyData} />

      {/* Year-over-Year Comparison */}
      <YearOverYearChart data={yoyData || []} isLoading={isLoadingYoY} />
    </div>
  );
}
