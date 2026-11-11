import React from 'react';
import { Modal, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppLottie } from './lottie-view';
import { Button } from './button';
import { Animations } from '@/constants/animations';

interface ModalFeedbackProps {
  visible: boolean;
  title: string;
  message?: string;
  type?: 'success' | 'error';
  lottieSource?: any;
  /** Congela la animación en este frame en lugar de reproducirla completa. */
  freezeAtFrame?: number;
  onClose: () => void;
}

export function ModalFeedback({
  visible,
  title,
  message,
  type = 'success',
  lottieSource,
  freezeAtFrame,
  onClose,
}: ModalFeedbackProps) {
  const animationToPlay =
    lottieSource || (type === 'success' ? Animations.successCheck : null);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-center p-6">
        <View className="bg-white rounded-3xl p-6 w-full max-w-sm items-center shadow-xl">
          {animationToPlay ? (
            <View className="w-28 h-28 mb-2">
              <AppLottie source={animationToPlay} loop={false} freezeAtFrame={freezeAtFrame} />
            </View>
          ) : (
            <View className="w-16 h-16 rounded-full bg-red-50 border-4 border-red-100 items-center justify-center mb-4">
              <Ionicons name="close" size={30} color="#ef4444" />
            </View>
          )}

          <Text className="text-xl font-bold text-slate-900 text-center mb-1">
            {title}
          </Text>

          {message ? (
            <Text className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
              {message}
            </Text>
          ) : (
            <View className="mb-4" />
          )}

          <Button
            title={type === 'success' ? 'Aceptar' : 'Entendido'}
            variant={type === 'success' ? 'primary' : 'danger'}
            onPress={onClose}
            className="w-full"
          />
        </View>
      </View>
    </Modal>
  );
}
