import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LoginForm } from '@/components/ui/login-form';
import { SignupForm } from '@/components/ui/signup-form';
import { HeroImage } from '@/components/ui/hero-image';

import { login, register as registerUser, clearError } from '@/store/slices/authSlice';
import { closeAuthModal, setAuthModalView } from '@/store/slices/uiSlice';
// Removed VisuallyHidden import

// Validation schemas
const loginSchema = yup.object({
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().required('Password is required'),
});

const registerSchema = yup.object({
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm Password is required'),
  firstName: yup.string().min(2, 'First name must be at least 2 characters').required('First name is required'),
  lastName: yup.string().min(2, 'Last name must be at least 2 characters').required('Last name is required'),
});

export function AuthModal() {
  const dispatch = useDispatch();
  const { isAuthModalOpen, authModalView } = useSelector((state) => state.ui);
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  
  // Local state for the animation view, synced with Redux
  const [isLoginView, setIsLoginView] = useState(true);

  useEffect(() => {
    setIsLoginView(authModalView === 'login');
  }, [authModalView]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(closeAuthModal());
    }
  }, [isAuthenticated, dispatch]);

  const handleClose = () => {
    dispatch(closeAuthModal());
    dispatch(clearError());
  };

  // Login Form Hooks
  const { 
    register: loginRegister, 
    handleSubmit: handleLoginSubmit, 
    formState: { errors: loginErrors },

    reset: resetLogin,
    setError: loginSetError
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  // Register Form Hooks
  const { 
    register: signupRegister, 
    handleSubmit: handleSignupSubmit, 
    formState: { errors: signupErrors },

    reset: resetSignup,
    setError: signupSetError
  } = useForm({
    resolver: yupResolver(registerSchema),
  });

  // Reset forms when modal closes or view changes
  useEffect(() => {
    if (!isAuthModalOpen) {
      resetLogin();
      resetSignup();
      dispatch(clearError());
    }
  }, [isAuthModalOpen, resetLogin, resetSignup, dispatch]);

  // Handle Server Errors by mapping them to fields
  useEffect(() => {
    if (error) {
       const errString = typeof error === 'string' ? error.toLowerCase() : '';
       let consumed = false;

       if (isLoginView) {
          if (errString.includes('password')) {
             loginSetError('password', { type: 'custom', message: error });
             consumed = true;
          } else if (errString.includes('user') || errString.includes('email') || errString.includes('credentials') || errString.includes('not found')) {
             loginSetError('email', { type: 'custom', message: error });
             consumed = true;
          }
       } else {
          // Signup logic
          if (errString.includes('email') || errString.includes('exists')) {
             signupSetError('email', { type: 'custom', message: error });
             consumed = true;
          }
       }

       // Only clear global error if we successfully mapped it to a field
       // This prevents the toast from showing if we are showing inline error
       if (consumed) {
           dispatch(clearError());
       }
    }
  }, [error, isLoginView, loginSetError, signupSetError, dispatch]);

  const onLogin = (data) => {
    dispatch(clearError());
    dispatch(login(data));
  };

  const onRegister = (data) => {
    dispatch(clearError());
    const { confirmPassword, ...rest } = data;
    
    // Send raw data, backend handles username generation
    const userData = {
      ...rest,
      isPrivate: false
    };
    
    dispatch(registerUser(userData));
  };


  const toggleView = (isLogin) => {
    dispatch(setAuthModalView(isLogin ? 'login' : 'signup'));
    dispatch(clearError());
  };

  // Mouse hover effect (optional, simplified for modal)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[600px] p-0 overflow-hidden bg-background border-border rounded-3xl shadow-2xl gap-0">
         {/* Accessibility Requirements */}
        <DialogTitle className="sr-only">Authentication</DialogTitle>
        <DialogDescription className="sr-only">
          {isLoginView ? "Login to your account" : "Create a new account"}
        </DialogDescription>

        <div className="relative w-full h-full flex overflow-hidden">
          {/* Error Toast inside Modal - Centered Top */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-6 left-0 right-0 z-50 flex justify-center pointer-events-none"
              >
                <div className="bg-destructive/10 backdrop-blur-md border border-destructive/20 text-destructive text-sm font-medium px-4 py-2 rounded-full shadow-lg">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form Container (Always on Left) */}
          <div className={`absolute top-0 left-0 h-full w-full lg:w-1/2 transition-all duration-700 ease-in-out z-20 ${isLoginView ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none -translate-x-[20%]'}`}>
             <div className="h-full w-full flex items-center justify-center bg-background">
               <LoginForm 
                 onSubmit={handleLoginSubmit(onLogin)} 
                 register={loginRegister} 
                 errors={loginErrors} 
                 loading={loading} 
               />
             </div>
          </div>

          {/* Signup Form Container (Always on Right, slides to Left on mobile logic or overlay slides on desktop) 
              Actually, for the "sliding overlay" effect:
              - Login Form is on Left.
              - Signup Form is on Right.
              - Overlay slides over the one not in use.
          */}
          
          <div className={`absolute top-0 left-0 lg:left-1/2 h-full w-full lg:w-1/2 transition-all duration-700 ease-in-out z-20 ${!isLoginView ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none translate-x-[20%]'}`}>
              <div className="h-full w-full flex items-center justify-center bg-background">
                <SignupForm 
                  onSubmit={handleSignupSubmit(onRegister)} 
                  register={signupRegister} 
                  errors={signupErrors} 
                  loading={loading}
                  onLoginClick={() => toggleView(true)}
                />
              </div>
          </div>

          {/* Sliding Overlay Container (Desktop Only) */}
          <div 
             className={`hidden lg:block absolute top-0 left-0 h-full w-1/2 overflow-hidden transition-transform duration-700 ease-in-out z-30 ${isLoginView ? 'translate-x-[100%]' : 'translate-x-0'}`}
          >
             {/* Inner container to counteract the outer translation for the background image effect */}
             <div className={`relative -left-full h-full w-[200%] transition-transform duration-700 ease-in-out ${isLoginView ? 'translate-x-[50%]' : 'translate-x-0'}`}>
               <HeroImage 
                 isLoginView={isLoginView} 
                 onToggle={() => toggleView(!isLoginView)} 
               />
             </div>
          </div>
          
           {/* Mobile Toggle Button (Visible only on small screens) */}
           <div className="lg:hidden absolute bottom-4 left-0 w-full text-center z-30">
             <button 
               onClick={() => toggleView(!isLoginView)}
               className="text-sm text-muted-foreground hover:text-primary underline font-medium"
             >
               {isLoginView ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
             </button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
