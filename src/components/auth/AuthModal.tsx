import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuthStore } from '../../store/authStore';

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

  const { login, register, isLoading } = useAuthStore();

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
      setErrors({ submit: 'Authentication failed. Please try again.' });
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

        <div className="flex flex-col space-y-3">
          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={switchMode}
              className="ml-1 p-0 h-auto font-medium text-blue-600 hover:text-blue-700"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </Button>
          </div>
        </div>
      </motion.form>
    </Modal>
  );
};