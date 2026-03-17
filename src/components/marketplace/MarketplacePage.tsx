import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Check, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useLayoutStore } from '../../store/layoutStore';
import { widgetConfig, widgetCategories, widgetZones } from '../../constants/widgets';
import type { WidgetCategory, WidgetZone } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const { widgets, addWidget, removeWidget } = useLayoutStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<WidgetCategory | 'all'>('all');
  const [selectedZones, setSelectedZones] = useState<Record<string, WidgetZone>>({});

  const filteredWidgets = useMemo(() => {
    return widgetConfig.filter((w) => {
      const matchesSearch =
        !search ||
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'all' || w.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const isAdded = (type: string) => widgets.some((w) => w.type === type);

  const handleAdd = (type: string) => {
    const zone = selectedZones[type] || 'right';

    addWidget(type as Parameters<typeof addWidget>[0], zone);
  };

  const handleRemove = (type: string) => {
    const widget = widgets.find((w) => w.type === type);
    if (widget) removeWidget(widget.id);
  };

  const getZone = (type: string) => selectedZones[type] || 'right';

  const categoryLabels: Record<WidgetCategory, string> = {
    productivity: 'Productivity',
    games: 'Games',
    creative: 'Creative',
    ai: 'AI',
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-cream-50 dark:bg-neutral-950">
      {/* Sticky bar under nav: back to writing always visible when scrolling */}
      <div className="sticky top-14 z-30 bg-cream-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="font-body flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-textMuted hover:text-sage-700 dark:hover:text-sage-400 transition-colors focus:outline-none focus:ring-2 focus:ring-sage-700 dark:focus:ring-sage-500 rounded px-1 -ml-1 py-0.5"
            aria-label="Back to writing"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Back to writing
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl sm:text-5xl text-neutral-900 dark:text-neutral-text tracking-tight">
            Widget Marketplace
          </h1>
          <p className="mt-2 text-lg text-neutral-500 dark:text-neutral-textMuted max-w-2xl">
            Browse and add widgets to customize your workspace. Each widget lives in a zone of your choosing.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search widgets..."
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {widgetCategories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.value
                    ? 'bg-sage-900 dark:bg-sage-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-textMuted hover:bg-sage-100 dark:hover:bg-neutral-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Widget Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWidgets.map((config, i) => {
            const added = isAdded(config.type);
            const Icon = config.icon;

            return (
              <motion.div
                key={config.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="group relative rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-surface shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Category Badge */}
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-textMuted">
                  {categoryLabels[config.category]}
                </span>

                <div className="p-5">
                  {/* Icon + Name */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-sage-100 dark:bg-sage-900/30 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-sage-700 dark:text-sage-400" />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-text leading-tight">
                        {config.name}
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-textMuted mt-0.5">
                        {config.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Section */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-700">
                    {added ? (
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-sage-700 dark:text-sage-400">
                          <Check className="w-4 h-4" />
                          Added
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(config.type)}
                          className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {/* Zone Selector */}
                        <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-600 overflow-hidden text-xs">
                          {widgetZones.map((z) => (
                            <button
                              key={z.value}
                              onClick={() => setSelectedZones((prev) => ({ ...prev, [config.type]: z.value }))}
                              className={`px-2 py-1 transition-colors ${
                                getZone(config.type) === z.value
                                  ? 'bg-sage-100 dark:bg-sage-900/40 text-sage-800 dark:text-sage-400 font-medium'
                                  : 'text-neutral-500 dark:text-neutral-textMuted hover:bg-neutral-50 dark:hover:bg-neutral-700'
                              }`}
                            >
                              {z.label}
                            </button>
                          ))}
                        </div>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAdd(config.type)}
                          className="ml-auto gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredWidgets.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-400 dark:text-neutral-500 text-lg">No widgets match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};
