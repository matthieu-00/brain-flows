import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Layout, 
  Zap, 
  Shield, 
  Smartphone, 
  Users,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { AuthModal } from '../auth/AuthModal';

export const LandingPage: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const features = [
    {
      icon: <FileText className="w-8 h-8 text-blue-600" />,
      title: 'Rich Text Editor',
      description: 'Google Docs-like editing experience with all the formatting tools you need.',
    },
    {
      icon: <Layout className="w-8 h-8 text-green-600" />,
      title: 'Modular Widgets',
      description: 'Customize your workspace with productivity tools that enhance your writing flow.',
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-600" />,
      title: 'Distraction-Free Mode',
      description: 'Focus on writing with a clean, minimal interface that eliminates distractions.',
    },
    {
      icon: <Shield className="w-8 h-8 text-purple-600" />,
      title: 'Auto-Save',
      description: 'Never lose your work with intelligent auto-saving and version control.',
    },
    {
      icon: <Smartphone className="w-8 h-8 text-pink-600" />,
      title: 'Responsive Design',
      description: 'Write anywhere with a fully responsive design that works on all devices.',
    },
    {
      icon: <Users className="w-8 h-8 text-indigo-600" />,
      title: 'Export Options',
      description: 'Export your documents to PDF, Word, or plain text with one click.',
    },
  ];

  const widgets = [
    { name: 'Sticky Notes', icon: '📝', description: 'Quick notes and flashcards' },
    { name: 'Chess Game', icon: '♟️', description: 'Take breaks with chess' },
    { name: 'Pomodoro Timer', icon: '⏱️', description: 'Focus time management' },
    { name: 'AI Chat', icon: '🤖', description: 'Writing assistant' },
    { name: 'Calculator', icon: '🧮', description: 'Quick calculations' },
    { name: 'Weather', icon: '🌤️', description: 'Stay informed' },
    { name: 'Drawing Canvas', icon: '🎨', description: 'Visual brainstorming' },
    { name: 'Sudoku', icon: '🧩', description: 'Brain training breaks' },
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-cream-100 to-sage-100">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <div className="flex items-center justify-center space-x-2 mb-6">
                <FileText className="w-12 h-12 text-sage-900" />
                <h1 className="text-5xl font-bold text-neutral-900">WriteSpace</h1>
              </div>
              
              <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
                The premium modular writing workspace that combines focused writing 
                with customizable productivity tools in a distraction-free environment.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Button
                  size="lg"
                  onClick={() => setShowAuthModal(true)}
                  className="w-full sm:w-auto px-8 py-3 text-lg"
                >
                  Start Writing Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-8 py-3 text-lg"
                >
                  Watch Demo
                </Button>
              </div>
            </motion.div>

            {/* Demo Screenshot */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="mt-16 relative"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="bg-white rounded-2xl shadow-2xl border border-neutral-300 overflow-hidden">
                <div className="bg-cream-100 px-6 py-3 border-b border-neutral-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <div className="p-6 min-h-64 bg-gradient-to-br from-cream-100 to-white">
                  <div className="flex space-x-6">
                    <div className="flex-1 bg-white rounded-lg shadow-sm border border-neutral-300 p-6">
                      <div className="space-y-3">
                        <div className="h-4 bg-neutral-300 rounded w-3/4"></div>
                        <div className="h-4 bg-neutral-300 rounded w-full"></div>
                        <div className="h-4 bg-neutral-300 rounded w-5/6"></div>
                        <div className="h-4 bg-sage-200 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="w-48 space-y-4">
                      <div className="bg-sage-100 rounded-lg p-4 shadow-sm">
                        <div className="h-3 bg-sage-200 rounded w-3/4 mb-2"></div>
                        <div className="h-2 bg-sage-200 rounded w-1/2"></div>
                      </div>
                      <div className="bg-cream-100 rounded-lg p-4 shadow-sm">
                        <div className="h-8 bg-sage-700 rounded-full w-16 mx-auto"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">
                Everything you need to write better
              </h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                WriteSpace combines the best of focused writing with productivity tools 
                that enhance your creative process.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow border border-neutral-300"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    {feature.icon}
                    <h3 className="text-xl font-semibold text-neutral-900">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-neutral-600">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Widgets Showcase */}
        <section className="py-20 bg-cream-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">
                Productivity widgets that work for you
              </h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Choose from a variety of widgets to create your perfect writing environment. 
                Each tool is designed to enhance, not distract from your writing flow.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {widgets.map((widget, index) => (
                <motion.div
                  key={widget.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="bg-white rounded-lg p-6 text-center hover:shadow-md transition-shadow border border-neutral-300"
                >
                  <div className="text-4xl mb-3">{widget.icon}</div>
                  <h3 className="font-semibold text-neutral-900 mb-2">{widget.name}</h3>
                  <p className="text-sm text-neutral-600">{widget.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-sage-900 to-sage-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to transform your writing experience?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              <p className="text-xl text-sage-100 mb-8 max-w-2xl mx-auto">
                Join thousands of writers who have made WriteSpace their go-to writing tool.
                Start your journey to better writing today.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Button
                  size="lg"
                  onClick={() => setShowAuthModal(true)}
                  className="w-full sm:w-auto px-8 py-3 text-lg"
                  variant="secondary"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                <div className="flex items-center space-x-2 text-blue-100">
                <div className="flex items-center space-x-2 text-sage-100">
                  <CheckCircle className="w-5 h-5" />
                  <span>No credit card required</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-neutral-900 text-white py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <FileText className="w-8 h-8 text-sage-200" />
                <h3 className="text-2xl font-bold">WriteSpace</h3>
              </div>
              <p className="text-neutral-600 mb-6">
                The premium modular writing workspace for focused writing.
              </p>
              <div className="text-sm text-neutral-600">
                © 2025 WriteSpace. Made with ❤️ for writers everywhere.
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};