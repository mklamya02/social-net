import React from 'react';
import { AppInput } from './app-input';
import { PasswordInput } from './password-input';

export function SignupForm({ onSubmit, register, errors, loading }) {
  return (
    <div className="form-container sign-up-container h-full z-10 w-full px-6 lg:px-12 flex flex-col justify-center">
      <form className='flex flex-col gap-5 max-w-md mx-auto w-full' onSubmit={onSubmit}>
        {/* Title Section */}
        <div className='text-center mb-1'>
          <h1 className='text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 dark:from-purple-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2'>
            Sign up
          </h1>
          <p className='text-muted-foreground text-sm'>
            Create your account to get started.
          </p>
        </div>

        <div className='flex flex-col gap-6'>
          <div className="flex flex-row gap-4">
            <div className="w-full flex-1">
              <AppInput
                id="signup-first-name"
                label="First Name"
                type="text"
                {...(register ? register('firstName') : {})}
              />
              {errors?.firstName && (
                <p className="text-destructive text-xs text-left mt-1.5 ml-1 font-medium">{errors.firstName.message}</p>
              )}
            </div>

            <div className="w-full flex-1">
              <AppInput
                id="signup-last-name"
                label="Last Name"
                type="text"
                {...(register ? register('lastName') : {})}
              />
              {errors?.lastName && (
                <p className="text-destructive text-xs text-left mt-1.5 ml-1 font-medium">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="w-full">
            <AppInput
              id="signup-email"
              label="Email"
              type="email"
              {...(register ? register('email') : {})}
            />
            {errors?.email && (
              <p className="text-destructive text-xs text-left mt-1.5 ml-1 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div className="w-full">
            <PasswordInput
              id="signup-password"
              label="Password"
              {...(register ? register('password') : {})}
            />
            {errors?.password && (
              <p className="text-destructive text-xs text-left mt-1.5 ml-1 font-medium">{errors.password.message}</p>
            )}
          </div>

          <div className="w-full">
            <PasswordInput
              id="signup-confirm-password"
              label="Confirm Password"
              {...(register ? register('confirmPassword') : {})}
            />
            {errors?.confirmPassword && (
              <p className="text-destructive text-xs text-left mt-1.5 ml-1 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="relative w-full h-12 rounded-xl font-semibold text-white text-base bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 hover:from-purple-700 hover:via-blue-700 hover:to-purple-700 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 ease-in-out hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden group"
        >
          <span className="relative z-10">{loading ? 'Signing up...' : 'Sign Up'}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
        </button>
      </form>
    </div>
  );
}
