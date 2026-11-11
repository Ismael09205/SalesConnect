import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PASSWORD_RULES } from '@/lib/validation';

/** Lista en vivo de los requisitos de contraseña segura. */
export function PasswordRequirements({ password }: { password: string }) {
  const passed = PASSWORD_RULES.filter((rule) => rule.test(password)).length;
  const strength = passed / PASSWORD_RULES.length;
  const barColor =
    strength === 1 ? 'bg-emerald-500' : strength >= 0.6 ? 'bg-amber-400' : 'bg-red-400';
  const strengthLabel =
    strength === 1 ? 'Contraseña segura' : strength >= 0.6 ? 'Contraseña media' : 'Contraseña débil';

  return (
    <View className="bg-slate-50 border border-slate-100 rounded-2xl p-3 mb-3.5 -mt-1.5">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-[11px] font-semibold text-slate-600">Tu contraseña debe tener:</Text>
        {password ? (
          <Text className="text-[11px] font-semibold text-slate-500">{strengthLabel}</Text>
        ) : null}
      </View>
      <View className="h-1.5 rounded-full bg-slate-200 mb-2.5 overflow-hidden">
        <View className={`h-full rounded-full ${barColor}`} style={{ width: `${strength * 100}%` }} />
      </View>
      <View className="gap-1">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <View key={rule.label} className="flex-row items-center gap-1.5">
              <Ionicons
                name={ok ? 'checkmark-circle' : 'ellipse-outline'}
                size={14}
                color={ok ? '#10b981' : '#94a3b8'}
              />
              <Text className={`text-[11px] ${ok ? 'text-emerald-700' : 'text-slate-500'}`}>
                {rule.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
