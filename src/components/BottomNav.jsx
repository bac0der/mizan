import React from 'react';
import { Compass, MessageSquareHeart, ListOrdered, SlidersHorizontal } from 'lucide-react';

const TABS = [
  { id: 'autopilot', label: 'Avtopilot', icon: Compass },
  { id: 'speech', label: 'Til & Fikr', icon: MessageSquareHeart },
  { id: 'timeline', label: 'Kun Oqimi', icon: ListOrdered },
  { id: 'settings', label: 'Sozlamalar', icon: SlidersHorizontal }
];

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 px-2 py-1.5">
      <div className="max-w-xl mx-auto grid grid-cols-4 gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-2 rounded-2xl transition cursor-pointer ${
                active
                  ? 'bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-extrabold mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
