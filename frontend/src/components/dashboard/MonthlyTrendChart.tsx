import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  [key: string]: string | number; // Allow dynamic properties for custom widgets
}

interface CustomWidget {
  id: string;
  title: string;
  engagementType: string;
  value: number;
  subtitle: string;
}

interface MonthlyTrendChartProps {
  data: MonthlyData[];
}

// Generate distinct colors for custom widgets
const generateColor = (index: number) => {
  const colors = [
    'hsl(210, 70%, 50%)',
    'hsl(150, 70%, 40%)',
    'hsl(30, 90%, 55%)',
    'hsl(270, 65%, 55%)',
    'hsl(190, 75%, 45%)',
    'hsl(350, 70%, 50%)',
    'hsl(60, 80%, 45%)',
    'hsl(120, 65%, 45%)',
  ];
  return colors[index % colors.length];
};

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
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

  if (!data || data.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg">Monthly Activity Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 flex items-center justify-center text-muted-foreground">
            No monthly data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg">Monthly Activity Trend</CardTitle>
        <p className="text-sm text-muted-foreground">Breakdown by engagement type and new families</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="engagements" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="engagements">Engagements</TabsTrigger>
            <TabsTrigger value="families">New Families</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="engagements">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ left: 0, right: 20, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(220, 10%, 45%)' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(0, 0%, 100%)', 
                      border: '1px solid hsl(210, 20%, 90%)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="butterflyFund" name="Butterfly Fund" stackId="a" fill="hsl(175, 65%, 35%)" />
                  <Bar dataKey="uberProgram" name="Uber Program" stackId="a" fill="hsl(38, 92%, 50%)" />
                  <Bar dataKey="rideForKids" name="Ride for Kids" stackId="a" fill="hsl(280, 65%, 60%)" />
                  <Bar dataKey="peerSupport" name="Peer Support" stackId="a" fill="hsl(200, 70%, 50%)" />
                  <Bar dataKey="webinars" name="Webinars" stackId="a" fill="hsl(340, 65%, 55%)" />
                  {/* Dynamically add custom widgets */}
                  {customWidgets.map((widget, index) => (
                    <Bar 
                      key={widget.id}
                      dataKey={`custom_${widget.id}`}
                      name={widget.title}
                      stackId="a"
                      fill={generateColor(index)}
                    />
                  ))}
                  <Bar dataKey="other" name="Other" stackId="a" fill="hsl(210, 15%, 70%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="families">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ left: 0, right: 20, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(220, 10%, 45%)' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(0, 0%, 100%)', 
                      border: '1px solid hsl(210, 20%, 90%)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="newFamilies" name="New Families" fill="hsl(175, 65%, 35%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="newlyDiagnosed" name="Newly Diagnosed" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="overview">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ left: 0, right: 20, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(220, 10%, 45%)' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(0, 0%, 100%)', 
                      border: '1px solid hsl(210, 20%, 90%)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="totalEngagements" 
                    name="Total Engagements"
                    stroke="hsl(175, 65%, 35%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(175, 65%, 35%)', strokeWidth: 0, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="newFamilies" 
                    name="New Families"
                    stroke="hsl(38, 92%, 50%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(38, 92%, 50%)', strokeWidth: 0, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="newlyDiagnosed" 
                    name="Newly Diagnosed"
                    stroke="hsl(280, 65%, 60%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(280, 65%, 60%)', strokeWidth: 0, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
