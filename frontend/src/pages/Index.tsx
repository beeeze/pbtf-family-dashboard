import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MainDashboard } from '@/components/dashboard/MainDashboard';
import { DirectServicesDashboard } from '@/components/dashboard/DirectServicesDashboard';
import { GeographicMapping } from '@/components/dashboard/GeographicMapping';
import { PatientFamiliesTable } from '@/components/dashboard/PatientFamiliesTable';
import { MetricFamiliesTable, FamilyListItem } from '@/components/dashboard/MetricFamiliesTable';
import { SyncProgress } from '@/components/dashboard/SyncProgress';
import { CustomWidgets } from '@/components/dashboard/CustomWidgets';
import { Settings } from '@/components/dashboard/Settings';
import { getFiscalYears, getCurrentFiscalYear, FiscalYear } from '@/lib/fiscalYear';
import { apiClient } from '@/lib/apiClient';
import { Users } from 'lucide-react';

interface PatientFamily {
  id: number;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdDate?: string;
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

interface FamilyLists {
  engagedFamilies: FamilyListItem[];
  newlyDiagnosedFamilies: FamilyListItem[];
  newFamilies: FamilyListItem[];
  firstTimeEngagedFamilies: FamilyListItem[];
  reEngagedFamilies: FamilyListItem[];
}

const defaultMetrics: DashboardMetrics = {
  totalFamilies: 0,
  totalInFiscalYear: 0,
  engagedCount: 0,
  notEngagedCount: 0,
  newlyDiagnosedCount: 0,
  totalInteractions: 0,
  familiesReached: 0,
  newFamiliesCount: 0,
  firstTimeEngagedCount: 0,
  reEngagedCount: 0,
  supportTypes: {
    butterflyFund: 0,
    uberProgram: 0,
    rideForKids: 0,
    peerSupport: 0,
    webinars: 0,
  },
  supportCalls: 0,
  monthlyData: [],
};

const defaultFamilyLists: FamilyLists = {
  engagedFamilies: [],
  newlyDiagnosedFamilies: [],
  newFamilies: [],
  firstTimeEngagedFamilies: [],
  reEngagedFamilies: [],
};

// Map engagement type strings to our categories
function categorizeEngagement(type: string): keyof DashboardMetrics['supportTypes'] | null {
  const t = type.toLowerCase();
  if (t.includes('butterfly') || t.includes('fund')) return 'butterflyFund';
  if (t.includes('uber') || t.includes('lyft') || t.includes('transportation')) return 'uberProgram';
  if (t.includes('ride for kids') || t.includes('rideforkids')) return 'rideForKids';
  if (t.includes('peer') || t.includes('connection') || t.includes('mentor')) return 'peerSupport';
  if (t.includes('webinar') || t.includes('education') || t.includes('workshop')) return 'webinars';
  return null;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const fiscalYears = getFiscalYears();
  const [selectedYear, setSelectedYear] = useState<FiscalYear>(getCurrentFiscalYear());
  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics);
  const [familyLists, setFamilyLists] = useState<FamilyLists>(defaultFamilyLists);
  const [families, setFamilies] = useState<PatientFamily[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [yoyData, setYoyData] = useState<YoYData[]>([]);
  const [isLoadingYoY, setIsLoadingYoY] = useState(false);

  // Fetch Year-over-Year comparison data
  const fetchYoYData = async () => {
    setIsLoadingYoY(true);
    try {
      const data = await apiClient.syncPatientFamilies('yoy-comparison');
      
      if (data?.success) {
        setYoyData(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch YoY data:', err);
    } finally {
      setIsLoadingYoY(false);
    }
  };

  // Fetch dashboard data from Virtuous with fiscal year filtering
  const fetchStats = async () => {
    setIsLoading(true);
    
    try {
      const data = await apiClient.syncPatientFamilies('dashboard', {
        fiscalYearStart: selectedYear.startDate.toISOString(),
        fiscalYearEnd: selectedYear.endDate.toISOString(),
      });
      
      if (data?.success) {
        // Store sync progress
        setTotalCount(data.totalFamilies || 0);
        setSyncedCount(data.analyzedFamilies || 0);
        
        // Process engagement types into our categories
        const supportTypes = { ...defaultMetrics.supportTypes };
        let totalInteractions = 0;
        
        const engagementTypes = data.engagementTypes as Record<string, number>;
        for (const [type, count] of Object.entries(engagementTypes || {})) {
          const category = categorizeEngagement(type);
          if (category) {
            supportTypes[category] += count;
          }
          totalInteractions += count;
        }
        
        console.log('Dashboard data:', data);
        
        // Use totalFamilies for master source count
        setMetrics({
          totalFamilies: data.totalFamilies || 0,
          totalInFiscalYear: data.totalInFiscalYear || 0,
          engagedCount: data.engagedCount || 0,
          notEngagedCount: (data.totalFamilies || 0) - (data.engagedCount || 0),
          newlyDiagnosedCount: data.newlyDiagnosedCount || 0,
          newFamiliesCount: data.newFamiliesCount || 0,
          firstTimeEngagedCount: data.firstTimeEngagedCount || 0,
          reEngagedCount: data.reEngagedCount || 0,
          familiesReached: data.engagedCount || 0,
          totalInteractions,
          supportTypes,
          supportCalls: 0,
          monthlyData: data.monthlyData || [],
        });
        
        // Store family lists for download tables
        setFamilyLists({
          engagedFamilies: data.engagedFamilies || [],
          newlyDiagnosedFamilies: data.newlyDiagnosedFamilies || [],
          newFamilies: data.newFamilies || [],
          firstTimeEngagedFamilies: data.firstTimeEngagedFamilies || [],
          reEngagedFamilies: data.reEngagedFamilies || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load families from cache for table
  const loadFamilies = async () => {
    try {
      const response = await apiClient.getPatientFamilies(0, 100);
      const data = response.families || [];
      
      setFamilies(data.map((f: any) => ({
        id: f.id,
        name: f.name,
        email: f.email || undefined,
        phone: f.phone || undefined,
        address: f.address || undefined,
        createdDate: f.created_date || undefined,
      })));
    } catch (err) {
      console.error('Failed to load families:', err);
    }
  };

  // Load stats on mount and when fiscal year changes
  useEffect(() => {
    fetchStats();
    loadFamilies();
    fetchYoYData();
  }, [selectedYear]);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Main Dashboard';
      case 'services': return 'Direct Services & Support';
      case 'geographic': return 'Geographic Mapping';
      case 'widgets': return 'Custom Widgets';
      case 'settings': return 'Settings';
      case 'help': return 'Help & Documentation';
      default: return 'Dashboard';
    }
  };

  const getPageSubtitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Family engagement metrics and reporting';
      case 'services': return 'Support calls, peer programs, and webinar tracking';
      case 'geographic': return 'Patient family distribution across the United States';
      case 'widgets': return 'Create custom widgets for specific engagement types';
      case 'settings': return 'Manage application settings and data';
      default: return '';
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={getPageTitle()}
          subtitle={getPageSubtitle()}
          fiscalYears={fiscalYears}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          onRefresh={fetchStats}
          isLoading={isLoading}
        />
        
        <div className="flex-1 overflow-auto bg-muted/30">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 p-6">
              {/* Total Patient Families - All Time (not affected by fiscal year) */}
              <div className="dashboard-card p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Patient Families</p>
                    <p className="text-3xl font-bold text-foreground">{totalCount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">All patient families regardless of fiscal year</p>
                  </div>
                </div>
              </div>
              
              <SyncProgress 
                syncedCount={syncedCount} 
                totalCount={totalCount} 
                onSyncProgress={(newCount) => setSyncedCount(newCount)}
                onSyncComplete={fetchStats}
              />
              <MainDashboard metrics={metrics} yoyData={yoyData} isLoadingYoY={isLoadingYoY} />
              
              {/* Metric Family Tables - Collapsible with Download */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Family Lists by Metric</h2>
                <MetricFamiliesTable
                  title="Engaged Families"
                  subtitle="Families with engagements in this fiscal year"
                  families={familyLists.engagedFamilies}
                  variant="engaged"
                />
                <MetricFamiliesTable
                  title="Newly Diagnosed"
                  subtitle="Families diagnosed this fiscal year"
                  families={familyLists.newlyDiagnosedFamilies}
                  variant="newlyDiagnosed"
                />
                <MetricFamiliesTable
                  title="New Families"
                  subtitle="Created and engaged in this fiscal year"
                  families={familyLists.newFamilies}
                  variant="newFamilies"
                />
                <MetricFamiliesTable
                  title="First Time Engaged"
                  subtitle="First engagement ever occurred this fiscal year"
                  families={familyLists.firstTimeEngagedFamilies}
                  variant="firstTimeEngaged"
                />
                <MetricFamiliesTable
                  title="Re-engaged Families"
                  subtitle="Previously engaged, active again this fiscal year"
                  families={familyLists.reEngagedFamilies}
                  variant="reEngaged"
                />
              </div>
              
              <PatientFamiliesTable families={families} />
            </div>
          )}
          
          {activeTab === 'services' && (
            <DirectServicesDashboard 
              peerSupport={metrics.supportTypes.peerSupport}
              webinars={metrics.supportTypes.webinars}
              selectedYear={selectedYear}
            />
          )}
          
          {activeTab === 'geographic' && (
            <GeographicMapping selectedYear={selectedYear} />
          )}
          
          {activeTab === 'widgets' && (
            <CustomWidgets selectedYear={selectedYear} />
          )}
          
          {activeTab === 'settings' && (
            <Settings />
          )}
          
          {activeTab === 'help' && (
            <div className="p-6">
              <p className="text-muted-foreground">Help documentation coming soon</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
