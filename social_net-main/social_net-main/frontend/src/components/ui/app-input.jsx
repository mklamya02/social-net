import React from 'react';

const AppInput = React.forwardRef((props, ref) => {
  const { label, placeholder, icon, ...rest } = props;

  return (
    <div className="w-full relative group">
      <div className="relative w-full">
        <input
          ref={ref}
          type="text"
          id={rest.id || rest.name}
          className={`peer relative z-10 w-full h-12 px-4 rounded-xl border-2 border-border bg-background/50 text-foreground font-medium text-base outline-none shadow-sm transition-all duration-300 ease-in-out hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-50 disabled:cursor-not-allowed ${icon ? 'pr-12' : ''} [&:-webkit-autofill]:!bg-background [&:-webkit-autofill]:!shadow-[0_0_0_1000px_hsl(var(--background))_inset] [&:-webkit-autofill]:![-webkit-text-fill-color:hsl(var(--foreground))] transition-colors caret-primary placeholder-shown:border-border placeholder:text-transparent pt-3 pb-1`}
          placeholder=" " 
          {...rest}
        />
        <label 
          htmlFor={rest.id || rest.name}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-muted-foreground bg-transparent px-1 text-base duration-300 transform origin-[0] pointer-events-none peer-focus:-top-0 peer-focus:text-xs peer-focus:text-primary peer-focus:bg-background peer-focus:px-1 peer-focus:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:scale-100 peer-placeholder-shown:translate-y-[-50%] peer-placeholder-shown:top-1/2 peer-[:not(:placeholder-shown)]:-top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-background peer-[:not(:placeholder-shown)]:translate-y-0"
        >
          {label}
        </label>
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
});

AppInput.displayName = "AppInput";

export { AppInput };
