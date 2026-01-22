import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PasswordInput = forwardRef((props, ref) => {
  const { label, placeholder, ...rest } = props;
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full min-w-[200px] relative group">
      <div className="relative w-full">
        <input
          ref={ref}
          type={showPassword ? "text" : "password"}
          id={rest.id || rest.name}
          className="peer relative z-10 w-full h-12 px-4 rounded-xl border-2 border-border bg-background/50 text-foreground font-medium text-base outline-none shadow-sm transition-all duration-300 ease-in-out hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-50 disabled:cursor-not-allowed pr-12 [&:-webkit-autofill]:!bg-background [&:-webkit-autofill]:!shadow-[0_0_0_1000px_hsl(var(--background))_inset] [&:-webkit-autofill]:!text-white [&:-webkit-autofill]:![-webkit-text-fill-color:#ffffff] transition-colors caret-primary placeholder-shown:border-border placeholder:text-transparent pt-3 pb-1"
          placeholder=" "
          {...rest}
        />
        <label 
          htmlFor={rest.id || rest.name}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-muted-foreground bg-transparent px-1 text-base duration-300 transform origin-[0] pointer-events-none peer-focus:-top-0 peer-focus:text-xs peer-focus:text-primary peer-focus:bg-background peer-focus:px-1 peer-focus:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:scale-100 peer-placeholder-shown:translate-y-[-50%] peer-placeholder-shown:top-1/2 peer-[:not(:placeholder-shown)]:-top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-background peer-[:not(:placeholder-shown)]:translate-y-0"
        >
          {label}
        </label>
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-muted-foreground hover:text-primary transition-colors duration-200 p-1 rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
