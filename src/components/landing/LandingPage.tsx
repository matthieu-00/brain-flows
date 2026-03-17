import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Button } from '../ui/Button';
import { AuthModal } from '../auth/AuthModal';
import {
  Pen, FileText, Calculator, Palette, Brain, ChevronRight, Check,
  Signature, Layout, Timer, Sparkles,
} from 'lucide-react';

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } },
  item: {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] } },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] } },
};

function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const LandingPage: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const features = [
    {
      icon: <FileText className="w-7 h-7" />,
      title: 'Rich Text Editor',
      description: 'Write with a powerful editor that supports formatting, auto-save, and seamless document management.',
    },
    {
      icon: <Layout className="w-7 h-7" />,
      title: 'Productivity Widgets',
      description: 'Access calculators, timers, chess, drawing, and more without leaving your writing space.',
    },
    {
      icon: <Brain className="w-7 h-7" />,
      title: 'AI-Powered Tools',
      description: 'Get writing assistance, brainstorm ideas, and enhance your creativity with integrated AI.',
      featured: true,
    },
    {
      icon: <Palette className="w-7 h-7" />,
      title: 'Customizable Layout',
      description: 'Arrange your workspace exactly how you want with draggable, resizable widget zones.',
    },
  ];

  const benefits = [
    'Distraction-free writing environment',
    'All tools in one integrated workspace',
    'Cloud sync across all devices',
    'Advanced formatting & export options',
    'AI-powered writing assistance',
  ];

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-cream-50 font-body">
      {/* ─── Hero ─── */}
      <div className="relative overflow-hidden">
        {/* Decorative gradient blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, #C8E6C9 0%, transparent 70%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 right-0 w-[400px] h-[400px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #E8F5E8 0%, transparent 70%)' }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          {/* Logo mark */}
          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.div variants={stagger.item} className="flex items-center justify-center gap-2 mb-8">
              <Signature className="w-7 h-7 text-sage-700" />
              <span className="font-display text-lg tracking-wide text-neutral-900">brainsflow.io</span>
            </motion.div>

            <motion.h1
              variants={stagger.item}
              className="font-display text-5xl sm:text-6xl md:text-7xl font-normal text-neutral-900 leading-[1.08] mb-6"
            >
              Your Writing,{' '}
              <span className="italic text-sage-700">Elevated</span>
            </motion.h1>

            <motion.p
              variants={stagger.item}
              className="text-lg sm:text-xl text-neutral-500 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              A writing workspace that pairs a powerful editor with productivity widgets
              and AI tools — all in one distraction-free environment.
            </motion.p>

            <motion.div variants={stagger.item} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => setShowAuthModal(true)}
                className="px-8 py-3 text-base"
              >
                Get Started Free
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                className="px-8 py-3 text-base"
                onClick={scrollToFeatures}
              >
                See Features
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ─── Features ─── */}
      <div id="features" className="py-24 bg-white relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl text-neutral-900 mb-4">
              Everything You Need to Write
            </h2>
            <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
              Powerful features designed to enhance your writing process and boost productivity.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <AnimatedSection key={index}>
                <div
                  className={`group relative p-6 rounded-xl border transition-all duration-300 h-full ${
                    feature.featured
                      ? 'border-sage-700 bg-sage-900 text-white shadow-lg shadow-sage-900/10 lg:-translate-y-2'
                      : 'border-neutral-200 bg-white hover:border-sage-400 hover:shadow-md'
                  }`}
                >
                  <div className={`inline-flex p-2.5 rounded-lg mb-4 ${
                    feature.featured
                      ? 'bg-sage-700/30 text-sage-100'
                      : 'bg-sage-100 text-sage-700'
                  }`}>
                    {feature.icon}
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    feature.featured ? 'text-white' : 'text-neutral-900'
                  }`}>
                    {feature.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${
                    feature.featured ? 'text-sage-200' : 'text-neutral-500'
                  }`}>
                    {feature.description}
                  </p>
                  {feature.featured && (
                    <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 bg-sage-400 text-sage-900 text-xs font-semibold rounded-full">
                      New
                    </div>
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Benefits / Product Glimpse ─── */}
      <div className="py-24 bg-cream-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <h2 className="font-display text-3xl md:text-4xl text-neutral-900 mb-6">
                Why Writers Choose <br className="hidden sm:block" />Our Platform
              </h2>
              <p className="text-lg text-neutral-500 mb-8 leading-relaxed">
                Join writers who have transformed their creative process
                with our integrated workspace.
              </p>
              <div className="space-y-3.5">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-sage-100 flex items-center justify-center">
                      <Check className="w-3 h-3 text-sage-700" />
                    </div>
                    <span className="text-neutral-700 leading-snug">{benefit}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            {/* Product glimpse — realistic mini-UI instead of skeleton */}
            <AnimatedSection>
              <div className="bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden">
                {/* Mini header */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-cream-50 border-b border-neutral-200">
                  <Signature className="w-4 h-4 text-sage-700" />
                  <span className="text-xs font-medium text-neutral-900">brainsflow.io</span>
                  <div className="ml-auto flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-neutral-300" />
                    <div className="w-2 h-2 rounded-full bg-neutral-300" />
                    <div className="w-2 h-2 rounded-full bg-neutral-300" />
                  </div>
                </div>
                {/* Mini editor + widget layout */}
                <div className="flex">
                  {/* Editor area */}
                  <div className="flex-1 p-5 border-r border-neutral-100">
                    <div className="font-display text-base text-neutral-900 mb-2">Chapter One</div>
                    <div className="space-y-1.5">
                      <div className="h-2 bg-neutral-100 rounded-full w-full" />
                      <div className="h-2 bg-neutral-100 rounded-full w-11/12" />
                      <div className="h-2 bg-neutral-100 rounded-full w-4/5" />
                      <div className="h-2 bg-sage-100 rounded-full w-3/5" />
                      <div className="h-2 bg-neutral-100 rounded-full w-10/12" />
                      <div className="h-2 bg-neutral-100 rounded-full w-full" />
                      <div className="h-2 bg-neutral-100 rounded-full w-9/12" />
                    </div>
                  </div>
                  {/* Widget sidebar */}
                  <div className="w-36 p-3 space-y-3">
                    <div className="rounded-lg border border-neutral-200 p-2.5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Timer className="w-3 h-3 text-sage-700" />
                        <span className="text-[10px] font-medium text-neutral-700">Timer</span>
                      </div>
                      <div className="text-center font-mono text-sm text-neutral-900">25:00</div>
                    </div>
                    <div className="rounded-lg border border-neutral-200 p-2.5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="w-3 h-3 text-sage-700" />
                        <span className="text-[10px] font-medium text-neutral-700">AI Chat</span>
                      </div>
                      <div className="space-y-1">
                        <div className="h-1.5 bg-sage-100 rounded-full w-full" />
                        <div className="h-1.5 bg-neutral-100 rounded-full w-4/5" />
                      </div>
                    </div>
                    <div className="rounded-lg border border-neutral-200 p-2.5">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Calculator className="w-3 h-3 text-sage-700" />
                        <span className="text-[10px] font-medium text-neutral-700">Calc</span>
                      </div>
                      <div className="grid grid-cols-3 gap-0.5">
                        {[7,8,9,4,5,6].map(n => (
                          <div key={n} className="text-[8px] text-center py-0.5 bg-neutral-50 rounded text-neutral-500">{n}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>

      {/* ─── CTA ─── */}
      <div className="relative py-24 bg-sage-900 overflow-hidden">
        {/* Grain texture overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />
        <div className="relative max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <h2 className="font-display text-3xl md:text-5xl text-white mb-6">
              Ready to Transform <br className="hidden sm:block" />Your Writing?
            </h2>
            <p className="text-lg text-sage-200 mb-10 leading-relaxed">
              Join our community of writers and experience the future of creative productivity.
            </p>
            <Button
              onClick={() => setShowAuthModal(true)}
              variant="secondary"
              className="px-8 py-3 text-base bg-white text-sage-900 hover:bg-cream-50"
            >
              Get Started Free
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </AnimatedSection>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Signature className="w-5 h-5 text-sage-400" />
                <span className="font-display text-lg">brainsflow.io</span>
              </div>
              <p className="text-neutral-400 text-sm leading-relaxed max-w-sm">
                The writing workspace that combines creativity
                with productivity in one seamless environment.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#features" className="text-neutral-300 hover:text-white transition-colors">Features</a></li>
                <li><span className="text-neutral-500 cursor-default">Pricing</span></li>
                <li><span className="text-neutral-500 cursor-default">Templates</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-4">Support</h4>
              <ul className="space-y-2.5 text-sm">
                <li><span className="text-neutral-500 cursor-default">Help Center</span></li>
                <li><span className="text-neutral-500 cursor-default">Contact Us</span></li>
                <li><span className="text-neutral-500 cursor-default">Community</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 mt-10 pt-8 text-center text-neutral-500 text-sm">
            <p>&copy; {new Date().getFullYear()} brainsflow.io. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default LandingPage;
