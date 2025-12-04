import { cn } from '@/lib/utils';
import { LayoutDashboard, HeartHandshake, Settings, HelpCircle, MapPin, Grid } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard },
  { id: 'services', label: 'Direct Services & Support', icon: HeartHandshake },
  { id: 'geographic', label: 'Geographic Mapping', icon: MapPin },
  { id: 'widgets', label: 'Custom Widgets', icon: Grid },
];

const bottomItems = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help', icon: HelpCircle },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col min-h-screen">
      {/* Logo Section */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden">
            <img 
              src="/logo.jpeg" 
              alt="PBTF Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="font-semibold text-sm leading-tight">Pediatric Brain</h1>
            <h1 className="font-semibold text-sm leading-tight">Tumor Foundation</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                activeTab === item.id
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="space-y-1">
          {bottomItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/50">
            Family Reporting Platform
          </p>
          <p className="text-xs text-sidebar-foreground/40">
            v1.0.0
          </p>
        </div>
      </div>
    </aside>
  );
}
