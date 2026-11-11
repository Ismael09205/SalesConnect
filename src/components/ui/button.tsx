import React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'google' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  className?: string;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  disabled,
  style,
  className = '',
  ...props
}: ButtonProps) {
  let baseClasses = 'flex-row items-center justify-center rounded-2xl';
  let sizeClasses = 'py-3.5 px-5';
  let textClasses = 'font-semibold text-center';

  if (size === 'sm') {
    sizeClasses = 'py-2 px-3.5 rounded-xl';
    textClasses = 'text-xs font-semibold';
  } else if (size === 'lg') {
    sizeClasses = 'py-4 px-6 rounded-2xl';
    textClasses = 'text-base font-bold';
  } else {
    textClasses = 'text-sm font-semibold';
  }

  let variantClasses = '';
  let variantTextClasses = '';

  switch (variant) {
    case 'primary':
      variantClasses = 'bg-blue-600 active:bg-blue-700 shadow-sm';
      variantTextClasses = 'text-white';
      break;
    case 'secondary':
      variantClasses = 'bg-slate-100 active:bg-slate-200';
      variantTextClasses = 'text-slate-800';
      break;
    case 'google':
      variantClasses = 'bg-white border border-slate-200 active:bg-slate-50 shadow-sm';
      variantTextClasses = 'text-slate-700 font-semibold';
      break;
    case 'outline':
      variantClasses = 'bg-transparent border border-slate-300 active:bg-slate-50';
      variantTextClasses = 'text-slate-700';
      break;
    case 'danger':
      variantClasses = 'bg-red-600 active:bg-red-700 shadow-sm';
      variantTextClasses = 'text-white';
      break;
    case 'success':
      variantClasses = 'bg-emerald-600 active:bg-emerald-700 shadow-sm';
      variantTextClasses = 'text-white';
      break;
  }

  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${
        isDisabled ? 'opacity-50' : ''
      } ${className}`}
      style={style}
      {...props}>
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'google' || variant === 'outline' || variant === 'secondary'
              ? '#1e293b'
              : '#ffffff'
          }
        />
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          {leftIcon}
          <Text className={`${textClasses} ${variantTextClasses}`}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
