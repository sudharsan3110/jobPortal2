import React from "react";
import { cn } from "@/utils/cn";

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
  animate = true,
}) => {
  return (
    <div className={cn("relative p-[1px] group", containerClassName)}>
      <div
        className={cn(
          "absolute inset-0 rounded-lg bg-gradient-to-r from-violet-500 via-blue-500 to-purple-500",
          animate && "group-hover:opacity-100 transition duration-500",
          className
        )}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg p-4">
        {children}
      </div>
    </div>
  );
};