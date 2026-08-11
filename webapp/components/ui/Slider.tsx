"use client";

import { type InputHTMLAttributes, forwardRef } from "react";

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  valueLabel?: string; // formatted display of the current value
}

// Always paired with a visible numeric label — DESIGN.md Section 6:
// "All slider/numeric inputs have visible numeric labels, not just a
// slider handle position."
export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ label, valueLabel, id, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {(label || valueLabel) && (
          <div className="mb-1.5 flex items-center justify-between">
            {label && (
              <label htmlFor={id} className="text-sm font-medium text-up-text-primary">
                {label}
              </label>
            )}
            {valueLabel && (
              <span className="font-data text-sm font-medium text-up-accent">{valueLabel}</span>
            )}
          </div>
        )}
        <input
          ref={ref}
          type="range"
          id={id}
          className={`h-2 w-full min-h-0 cursor-pointer appearance-none rounded-full bg-up-border accent-up-accent ${className}`}
          {...props}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";
