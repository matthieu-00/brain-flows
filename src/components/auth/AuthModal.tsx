import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { login, register, loginWithProvider, isLoading } = useAuthStore();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin && !name) {
      newErrors.name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      onClose();
      setEmail('');
      setPassword('');
      setName('');
      setErrors({});
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed. Please try again.';
      setErrors({ submit: message });
      useToastStore.getState().addToast(message, 'error');
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setErrors({});
    try {
      await loginWithProvider(provider);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to start ${provider} sign in.`;
      setErrors({ submit: message });
      useToastStore.getState().addToast(message, 'error');
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isLogin ? 'Sign In' : 'Create Account'}
    >
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {!isLogin && (
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            placeholder="Enter your full name"
          />
        )}

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="Enter your email"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          placeholder="Enter your password"
          hint={!isLogin ? 'Must be at least 6 characters' : undefined}
        />

        {errors.submit && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
            {errors.submit}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading}
            className="w-full"
          >
            Continue with Google
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthLogin('github')}
            disabled={isLoading}
            className="w-full"
          >
            Continue with GitHub
          </Button>
        </div>

        <div className="flex flex-col space-y-3">
          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>

          <div className="text-center">
            <span className="text-sm text-neutral-600 dark:text-neutral-textMuted">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={switchMode}
              className="ml-1 p-0 h-auto font-medium text-sage-700 hover:text-sage-900 dark:text-sage-400 dark:hover:text-sage-200"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </Button>
          </div>
        </div>
      </motion.form>
    </Modal>
  );
};