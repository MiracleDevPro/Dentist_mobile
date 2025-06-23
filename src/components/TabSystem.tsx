import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TabProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: React.ReactNode;
}

interface TabSystemProps {
  tabs: TabProps[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  tabClassName?: string;
  orientation?: 'horizontal' | 'vertical';
  mobileBottom?: boolean;
}

export const TabSystem: React.FC<TabSystemProps> = ({
  tabs,
  defaultTab,
  onChange,
  className = '',
  tabClassName = '',
  orientation = 'horizontal',
  mobileBottom = false,
}) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id || '');

  const handleTabChange = (tabId: string) => {
    if (tabs.find(tab => tab.id === tabId)?.disabled) return;
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <div
      className={cn(
        'relative',
        orientation === 'horizontal' ? 'flex flex-col' : 'flex flex-row',
        mobileBottom && 'fixed bottom-0 left-0 right-0 z-10 md:relative md:z-auto',
        className
      )}
    >
      {/* Tab List */}
      <div
        className={cn(
          'flex',
          orientation === 'horizontal'
            ? 'flex-row border-b border-gray-200'
            : 'flex-col border-r border-gray-200',
          mobileBottom && 'bg-white border-t border-gray-200 shadow-lg'
        )}
      >
        {tabs.map((tab) => (
          <div key={tab.id} className="relative">
            <button
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'relative px-4 py-4 flex items-center justify-center transition-colors',
                activeTab === tab.id
                  ? 'text-black bg-black/10 rounded-md font-bold'
                  : 'text-gray-500 hover:text-gray-800 font-medium',
                tab.disabled && 'opacity-50 cursor-not-allowed',
                tabClassName,
                mobileBottom && 'flex-1 flex flex-col items-center text-xs',
                'min-w-[90px] flex-1 md:flex-none'
              )}
              disabled={tab.disabled}
              aria-selected={activeTab === tab.id}
            >
              {tab.icon && (
                <span className={cn('inline-block', mobileBottom ? 'mb-1' : 'mr-2')}>
                  {tab.icon}
                </span>
              )}
              <span className="text-xs">{tab.label}</span>
            </button>
            
            {/* Badge */}
            {tab.badge && (
              <div className="relative">
                {tab.badge}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Tab content will be handled by parent component using the onChange callback */}
    </div>
  );
};

interface TabContentProps {
  active: boolean;
  children: React.ReactNode;
  animateHeight?: boolean;
  className?: string;
}

export const TabContent: React.FC<TabContentProps> = ({
  active,
  children,
  animateHeight = false,
  className = '',
}) => {
  return (
    <div
      className={cn(
        'transition-all duration-200 ease-in-out',
        active ? 'block opacity-100' : 'hidden opacity-0',
        className
      )}
    >
      {active && children}
    </div>
  );
};
