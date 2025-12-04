import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CustomWidget {
  id: string;
  title: string;
  engagementType: string;
  value: number;
  subtitle: string;
}

interface SupportTypeChartProps {
  supportTypes: {
    butterflyFund: number;
    uberProgram: number;
    rideForKids: number;
    peerSupport: number;
    webinars: number;
  };
  customWidgets?: CustomWidget[];
}

export function SupportTypeChart({ supportTypes, customWidgets = [] }: SupportTypeChartProps) {
  // Base support types (locked widgets)
  const baseData = [
    { name: 'Butterfly Fund', value: supportTypes.butterflyFund, isCustom: false },
    { name: 'Uber Program', value: supportTypes.uberProgram, isCustom: false },
    { name: 'Ride for Kids', value: supportTypes.rideForKids, isCustom: false },
    { name: 'Peer Support', value: supportTypes.peerSupport, isCustom: false },
    { name: 'Webinars', value: supportTypes.webinars, isCustom: false },
  ];

  // Add custom widgets to the chart
  const customData = customWidgets.map(widget => ({
    name: widget.title,
    value: widget.value,
    isCustom: true
  }));

  // Combine and sort by value
  const data = [...baseData, ...customData].sort((a, b) => b.value - a.value);

  // Calculate dynamic height based on number of items
  const chartHeight = Math.max(280, data.length * 40);

  return (
    <div className="chart-container animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Engagement Breakdown
        {customWidgets.length > 0 && (
          <span className="text-sm text-muted-foreground ml-2">
            (includes {customWidgets.length} custom widget{customWidgets.length !== 1 ? 's' : ''})
          </span>
        )}
      </h3>
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
            <XAxis type="number" tick={{ fill: 'hsl(220, 10%, 45%)' }} />
            <YAxis 
              dataKey="name" 
              type="category" 
              tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 12 }} 
              width={120}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(0, 0%, 100%)', 
                border: '1px solid hsl(210, 20%, 90%)',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string, props: any) => [
                value.toLocaleString(), 
                props.payload.isCustom ? 'Custom Engagement' : 'Engagements'
              ]}
            />
            <Bar 
              dataKey="value" 
              fill="hsl(175, 55%, 55%)" 
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
