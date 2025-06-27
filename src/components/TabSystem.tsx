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
          'flex bg-white rounded-2xl shadow-lg border border-gray-100 p-1',
          orientation === 'horizontal'
            ? 'flex-row'
            : 'flex-col',
          mobileBottom && 'bg-white border-t border-gray-200 shadow-lg'
        )}
      >
        {tabs.map((tab) => (
          <div key={tab.id} className="relative flex-1">
            <button
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'relative w-full px-6 py-4 flex items-center justify-center transition-all duration-300 ease-out group',
                'rounded-xl font-medium text-sm relative overflow-hidden',
                activeTab === tab.id
                  ? 'text-white bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
                tab.disabled && 'opacity-50 cursor-not-allowed',
                tabClassName,
                mobileBottom && 'flex-1 flex flex-col items-center text-xs',
                'min-w-[90px] flex-1 md:flex-none'
              )}
              disabled={tab.disabled}
              aria-selected={activeTab === tab.id}
            >
              {/* Active tab background with shimmer effect */}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              
              {/* Shimmer effect for active tab */}
              {activeTab === tab.id && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
              
              {/* Content wrapper */}
              <div className="relative z-10 flex items-center justify-center gap-3">
                {tab.icon && (
                  <motion.span 
                    className={cn(
                      'inline-block transition-all duration-200',
                      mobileBottom ? 'mb-1' : '',
                      activeTab === tab.id ? 'scale-110 text-white' : 'group-hover:scale-105'
                    )}
                    animate={{
                      scale: activeTab === tab.id ? 1.1 : 1,
                    }}
                  >
                    {tab.icon}
                  </motion.span>
                )}
                <motion.span 
                  className={cn(
                    "text-xs font-medium transition-all duration-200",
                    activeTab === tab.id ? "text-white font-semibold" : ""
                  )}
                  animate={{
                    fontWeight: activeTab === tab.id ? 600 : 500,
                  }}
                >
                  {tab.label}
                </motion.span>
              </div>
              
              {/* Badge */}
              {tab.badge && (
                <div className="absolute -top-1 -right-1 z-20">
                  {tab.badge}
                </div>
              )}
            </button>
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
    <motion.div
      className={cn(
        'transition-all duration-300 ease-out',
        className
      )}
      initial={false}
      animate={{
        opacity: active ? 1 : 0,
        y: active ? 0 : 8,
        scale: active ? 1 : 0.99,
      }}
      transition={{
        duration: 0.25,
        ease: "easeOut"
      }}
      style={{
        display: active ? 'block' : 'none'
      }}
    >
      {active && children}
    </motion.div>
  );
};