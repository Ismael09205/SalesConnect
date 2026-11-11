import React, { useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './button';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  /** Nombre del elemento afectado; se resalta dentro de la tarjeta. */
  highlight?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tone?: 'danger' | 'primary';
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/** Ventana de confirmación propia de la app (reemplaza al Alert nativo). */
export function ConfirmDialog({
  visible,
  title,
  message,
  highlight,
  icon,
  tone = 'danger',
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const isDanger = tone === 'danger';

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 bg-black/50 items-center justify-center p-6">
        <View className="bg-white rounded-3xl p-6 w-full max-w-sm items-center shadow-xl">
          <View
            className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
              isDanger ? 'bg-red-50 border-4 border-red-100' : 'bg-blue-50 border-4 border-blue-100'
            }`}>
            <Ionicons name={icon} size={28} color={isDanger ? '#ef4444' : '#2563eb'} />
          </View>

          <Text className="text-lg font-bold text-slate-900 text-center mb-1">{title}</Text>

          {highlight ? (
            <View className="px-3 py-1 rounded-full bg-slate-100 mb-2 max-w-full">
              <Text className="text-xs font-bold text-slate-700" numberOfLines={1}>
                {highlight}
              </Text>
            </View>
          ) : null}

          <Text className="text-sm text-slate-500 text-center mb-6 leading-relaxed">{message}</Text>

          <Button
            title={confirmLabel}
            variant={isDanger ? 'danger' : 'primary'}
            onPress={handleConfirm}
            isLoading={loading}
            className="w-full mb-2.5"
          />
          <Button
            title={cancelLabel}
            variant="secondary"
            onPress={onCancel}
            disabled={loading}
            className="w-full"
          />
        </View>
      </View>
    </Modal>
  );
}
