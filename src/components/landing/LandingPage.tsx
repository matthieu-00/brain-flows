import React from 'react';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/authStore';
import { Pen, FileText, Calculator, Clock, Palette, Brain, ChevronRight, Check } from 'lucide-react';

const LandingPage: React.FC = () => {
  const { setShowAuthModal } = useAuthStore();

  const features = [
    {
      icon: <FileText className="w-8 h-8 text-sage-700" />,
      title: "Rich Text Editor",
      description: "Write with a powerful editor that supports formatting, auto-save, and seamless collaboration."
    },
    {
      icon: <Calculator className="w-8 h-8 text-sage-700" />,
      title: "Productivity Widgets",
      description: "Access calculators, timers, chess games, and more without leaving your writing space."
    },
    {
      icon: <Brain className="w-8 h-8 text-sage-700" />,
      title: "AI-Powered Tools",
      description: "Get writing assistance, brainstorm ideas, and enhance your creativity with AI integration."
    },
    {
      icon: <Palette className="w-8 h-8 text-sage-700" />,
      title: "Customizable Layout",
      description: "Arrange your workspace exactly how you want with draggable, resizable widget zones."
    }
  ];

  const benefits = [
    "Distraction-free writing environment",
    "All tools in one integrated workspace",
    "Cloud sync across all devices",
    "Collaborative editing features",
    "Advanced formatting options",
    "AI-powered writing assistance"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-sage-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6">
              Your Ultimate
              <span className="text-sage-700 block">Writing Workspace</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
              Combine powerful writing tools with productivity widgets in one seamless, 
              distraction-free environment. Write better, work smarter, create more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setShowAuthModal(true)}
                className="px-8 py-3 text-lg"
              >
                Get Started Free
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                variant="secondary"
                className="px-8 py-3 text-lg"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Everything You Need to Write
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Powerful features designed to enhance your writing process and boost productivity.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg border border-neutral-300 hover:border-sage-700 transition-colors">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-neutral-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-cream-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">
                Why Writers Choose Our Platform
              </h2>
              <p className="text-xl text-neutral-600 mb-8">
                Join thousands of writers who have transformed their creative process 
                with our integrated workspace solution.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="w-5 h-5 text-sage-700 mr-3 flex-shrink-0" />
                    <span className="text-neutral-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg border border-neutral-300">
              <div className="space-y-4">
                <div className="h-4 bg-neutral-100 rounded w-3/4"></div>
                <div className="h-4 bg-neutral-100 rounded w-full"></div>
                <div className="h-4 bg-neutral-100 rounded w-5/6"></div>
                <div className="h-20 bg-sage-100 rounded flex items-center justify-center">
                  <Pen className="w-8 h-8 text-sage-700" />
                </div>
                <div className="h-4 bg-neutral-100 rounded w-2/3"></div>
                <div className="h-4 bg-neutral-100 rounded w-4/5"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-sage-900 to-sage-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Writing?
          </h2>
          <p className="text-xl text-sage-100 mb-8">
            Join our community of writers and experience the future of creative productivity.
          </p>
          <Button 
            onClick={() => setShowAuthModal(true)}
            variant="secondary"
            className="px-8 py-3 text-lg bg-white text-sage-900 hover:bg-cream-50"
          >
            Get Started Free
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <h3 className="text-xl font-bold mb-4">Writing Workspace</h3>
              <p className="text-neutral-300 mb-4">
                The ultimate platform for writers who want to combine creativity 
                with productivity in one seamless workspace.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-neutral-300">
                <li>Features</li>
                <li>Pricing</li>
                <li>Templates</li>
                <li>Integrations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-neutral-300">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Community</li>
                <li>Status</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-700 mt-8 pt-8 text-center text-neutral-400">
            <p>&copy; 2025 Writing Workspace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;