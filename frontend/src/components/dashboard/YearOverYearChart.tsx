import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface YoYData {
  fiscalYear: string;
  engaged: number;
  newlyDiagnosed: number;
  newFamilies: number;
  firstTimeEngaged: number;
  reEngaged: number;
  totalEngagements: number;
  [key: string]: string | number; // Allow dynamic properties for custom widgets
}

interface CustomWidget {
  id: string;
  title: string;
  engagementType: string;
  value: number;
  subtitle: string;
}

interface YearOverYearChartProps {
  data: YoYData[];
  isLoading?: boolean;
}

// Generate distinct colors for custom widgets
const generateColor = (index: number) => {
  const colors = [
    'hsl(210, 70%, 50%)',
    'hsl(150, 70%, 40%)',
    'hsl(30, 90%, 55%)',
    'hsl(270, 65%, 55%)',
    'hsl(190, 75%, 45%)',
  ];
  return colors[index % colors.length];
};

export function YearOverYearChart({ data, isLoading }: YearOverYearChartProps) {
  const [customWidgets, setCustomWidgets] = useState<CustomWidget[]>([]);

  // Load custom widgets
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
    window.addEventListener('customWidgetsUpdated', loadWidgets);
    return () => window.removeEventListener('customWidgetsUpdated', loadWidgets);
  }, []);
  if (isLoading) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg">Year-over-Year Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            Loading comparison data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg">Year-over-Year Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            No comparison data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Reverse to show oldest first
  const chartData = [...data].reverse();

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg">Year-over-Year Comparison</CardTitle>
        <p className="text-sm text-muted-foreground">Comparing metrics across fiscal years</p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: 0, right: 20, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
              <XAxis 
                dataKey="fiscalYear" 
                tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 12 }}
              />
              <YAxis tick={{ fill: 'hsl(220, 10%, 45%)' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(0, 0%, 100%)', 
                  border: '1px solid hsl(210, 20%, 90%)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar 
                dataKey="engaged" 
                name="Engaged Families"
                fill="hsl(175, 65%, 35%)" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="newFamilies" 
                name="New Families"
                fill="hsl(38, 92%, 50%)" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="newlyDiagnosed" 
                name="Newly Diagnosed"
                fill="hsl(280, 65%, 60%)" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="firstTimeEngaged" 
                name="First Time Engaged"
                fill="hsl(200, 70%, 50%)" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="reEngaged" 
                name="Re-engaged"
                fill="hsl(340, 65%, 55%)" 
                radius={[4, 4, 0, 0]}
              />
              {/* Dynamically add custom widgets */}
              {customWidgets.map((widget, index) => (
                <Bar 
                  key={widget.id}
                  dataKey={`custom_${widget.id}`}
                  name={widget.title}
                  fill={generateColor(index)}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
