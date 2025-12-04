import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface EngagementChartProps {
  engaged: number;
  notEngaged: number;
}

export function EngagementChart({ engaged, notEngaged }: EngagementChartProps) {
  const data = [
    { name: 'Engaged', value: engaged, color: 'hsl(175, 65%, 35%)' },
    { name: 'Not Engaged', value: notEngaged, color: 'hsl(210, 15%, 70%)' },
  ];

  return (
    <div className="chart-container animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">Family Engagement Status</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
            <XAxis type="number" tick={{ fill: 'hsl(220, 10%, 45%)' }} />
            <YAxis 
              dataKey="name" 
              type="category" 
              tick={{ fill: 'hsl(220, 10%, 45%)' }} 
              width={100}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(0, 0%, 100%)', 
                border: '1px solid hsl(210, 20%, 90%)',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [value.toLocaleString(), 'Families']}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
