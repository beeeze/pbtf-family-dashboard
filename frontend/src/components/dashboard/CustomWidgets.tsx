import { useState, useEffect } from 'react';
import { KPICard } from './KPICard';
import { Activity, Plus, X, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/apiClient';
import { FiscalYear } from '@/lib/fiscalYear';

interface CustomWidget {
  id: string;
  title: string;
  engagementType: string;
  value: number;
  subtitle: string;
}

interface CustomWidgetsProps {
  selectedYear: FiscalYear;
}

// Available engagement types that users can choose from
const engagementTypes = [
  { value: 'butterfly_fund', label: 'Butterfly Fund' },
  { value: 'uber_program', label: 'Uber/Lyft Program' },
  { value: 'ride_for_kids', label: 'Ride for Kids' },
  { value: 'peer_support', label: 'Peer-to-Peer Support' },
  { value: 'webinars', label: 'Webinars' },
  { value: 'education', label: 'Educational Programs' },
  { value: 'workshops', label: 'Workshops' },
  { value: 'counseling', label: 'Counseling Services' },
  { value: 'financial_assistance', label: 'Financial Assistance' },
  { value: 'transportation', label: 'Transportation Services' },
  { value: 'lodging', label: 'Lodging Assistance' },
  { value: 'support_groups', label: 'Support Groups' },
  { value: 'mentorship', label: 'Mentorship Programs' },
  { value: 'other', label: 'Other Services' },
];

export function CustomWidgets({ selectedYear }: CustomWidgetsProps) {
  const [widgets, setWidgets] = useState<CustomWidget[]>([]);
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load saved widgets from localStorage
  useEffect(() => {
    const savedWidgets = localStorage.getItem('customWidgets');
    if (savedWidgets) {
      setWidgets(JSON.parse(savedWidgets));
    }
  }, []);

  // Save widgets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('customWidgets', JSON.stringify(widgets));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('customWidgetsUpdated'));
  }, [widgets]);

  // Fetch engagement data for a specific type
  const fetchEngagementData = async (engagementType: string): Promise<number> => {
    try {
      setIsLoading(true);
      // Call the dashboard endpoint to get engagement data
      const data = await apiClient.syncPatientFamilies('dashboard', {
        fiscalYearStart: selectedYear.startDate.toISOString(),
        fiscalYearEnd: selectedYear.endDate.toISOString(),
      });

      // Parse engagement types and find the selected one
      const engagementTypes = data.engagementTypes as Record<string, number>;
      
      // Match the engagement type (case-insensitive search)
      let count = 0;
      const searchTerm = engagementType.replace(/_/g, ' ').toLowerCase();
      
      for (const [type, value] of Object.entries(engagementTypes || {})) {
        if (type.toLowerCase().includes(searchTerm) || searchTerm.includes(type.toLowerCase())) {
          count += value;
        }
      }

      return count;
    } catch (err) {
      console.error('Failed to fetch engagement data:', err);
      return 0;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWidget = async () => {
    if (!selectedType) return;

    const typeLabel = engagementTypes.find(t => t.value === selectedType)?.label || selectedType;
    const title = customTitle || typeLabel;

    // Fetch the actual data for this engagement type
    const value = await fetchEngagementData(selectedType);

    const newWidget: CustomWidget = {
      id: `widget-${Date.now()}`,
      title,
      engagementType: selectedType,
      value,
      subtitle: `${selectedYear.label}`,
    };

    setWidgets([...widgets, newWidget]);
    setIsAddingWidget(false);
    setSelectedType('');
    setCustomTitle('');
  };

  const handleRemoveWidget = (id: string) => {
    const updatedWidgets = widgets.filter(w => w.id !== id);
    setWidgets(updatedWidgets);
    if (updatedWidgets.length === 0) {
      localStorage.removeItem('customWidgets');
      window.dispatchEvent(new Event('customWidgetsUpdated'));
    }
  };

  // Refresh widget data when fiscal year changes
  useEffect(() => {
    const refreshWidgets = async () => {
      if (widgets.length === 0) return;
      
      const updatedWidgets = await Promise.all(
        widgets.map(async (widget) => ({
          ...widget,
          value: await fetchEngagementData(widget.engagementType),
          subtitle: `${selectedYear.label}`,
        }))
      );
      
      setWidgets(updatedWidgets);
    };

    refreshWidgets();
  }, [selectedYear]);

  return (
    <div className="p-6 space-y-6">
      {/* Header with Add Widget Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Custom Engagement Widgets</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add custom widgets to track specific engagement types
          </p>
        </div>
        
        <Dialog open={isAddingWidget} onOpenChange={setIsAddingWidget}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Widget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Engagement Widget</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="engagement-type">Engagement Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger id="engagement-type">
                    <SelectValue placeholder="Select engagement type" />
                  </SelectTrigger>
                  <SelectContent>
                    {engagementTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="custom-title">Custom Title (Optional)</Label>
                <Input
                  id="custom-title"
                  placeholder="Leave blank to use engagement type name"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingWidget(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddWidget} 
                disabled={!selectedType || isLoading}
              >
                {isLoading ? 'Loading...' : 'Add Widget'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Widgets Grid */}
      {widgets.length === 0 ? (
        <div className="chart-container text-center py-12">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Custom Widgets Yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Click "Add Widget" to create your first custom engagement widget
          </p>
        </div>
      ) : (
        <div className="dashboard-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {widgets.map((widget) => (
            <div key={widget.id} className="relative group">
              <KPICard
                title={widget.title}
                value={widget.value}
                subtitle={widget.subtitle}
                icon={TrendingUp}
                variant="accent"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                onClick={() => handleRemoveWidget(widget.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="chart-container">
        <h3 className="text-lg font-semibold text-foreground mb-2">About Custom Widgets</h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            Custom widgets allow you to track specific engagement types beyond the three locked metrics 
            (Butterfly Fund, Uber Program, and Ride for Kids).
          </p>
          <p>
            • Select from predefined engagement types or create your own
          </p>
          <p>
            • Widgets automatically update when you change fiscal years
          </p>
          <p>
            • Remove any widget by hovering over it and clicking the X button
          </p>
          <p>
            • Your custom widgets are saved locally and will persist between sessions
          </p>
        </div>
      </div>
    </div>
  );
}
