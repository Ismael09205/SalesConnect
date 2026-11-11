import React, { useRef, useState } from 'react';
import {
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useKeyboardScroll } from './keyboard-aware-scroll-view';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  /** Texto de ayuda bajo el campo cuando no hay error. */
  hint?: string;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
  /** Muestra "actual/máximo" cuando hay maxLength. */
  showCount?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  isPassword = false,
  showCount = false,
  className,
  style,
  onFocus,
  onBlur,
  maxLength,
  value,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(!isPassword);
  const [isFocused, setIsFocused] = useState(false);
  const fieldRef = useRef<View>(null);
  const keyboardScroll = useKeyboardScroll();

  const borderClasses = error
    ? 'border-red-500 bg-red-50/40'
    : isFocused
    ? 'border-blue-500 bg-white'
    : 'border-slate-200 bg-slate-50/80';

  return (
    <View ref={fieldRef} collapsable={false} className="w-full gap-1.5 mb-3.5">
      {label && (
        <Text className="text-xs font-semibold text-slate-700 tracking-wide">
          {label}
        </Text>
      )}
      <View className={`flex-row items-center border rounded-2xl px-3.5 py-3 gap-2.5 ${borderClasses}`}>
        {leftIcon}
        <TextInput
          className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 p-0"
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize="none"
          autoCorrect={!isPassword}
          placeholderTextColor="#94a3b8"
          style={style}
          value={value}
          maxLength={maxLength}
          onFocus={(e) => {
            setIsFocused(true);
            keyboardScroll?.onFieldFocus(fieldRef.current);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#64748b"
            />
          </TouchableOpacity>
        )}
      </View>
      {error || hint || (showCount && maxLength) ? (
        <View className="flex-row items-start justify-between gap-2 ml-1">
          {error ? (
            <View className="flex-row items-start gap-1 flex-1">
              <Ionicons name="alert-circle" size={13} color="#ef4444" style={{ marginTop: 1 }} />
              <Text className="text-xs text-red-500 font-medium flex-1">{error}</Text>
            </View>
          ) : hint ? (
            <Text className="text-[11px] text-slate-400 flex-1">{hint}</Text>
          ) : (
            <View className="flex-1" />
          )}
          {showCount && maxLength ? (
            <Text className="text-[11px] text-slate-400">
              {(value ?? '').length}/{maxLength}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
