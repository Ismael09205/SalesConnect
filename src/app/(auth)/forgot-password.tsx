import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyboardAwareScrollView } from '@/components/ui/keyboard-aware-scroll-view';
import { AppLottie } from '@/components/ui/lottie-view';
import { ModalFeedback } from '@/components/ui/modal-feedback';
import { Animations } from '@/constants/animations';
import { LIMITS, sanitizeEmail, translateError, validateEmail } from '@/lib/validation';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { sendPasswordResetEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleReset = async () => {
    const validation = validateEmail(email);
    setEmailError(validation);
    if (validation) {
      setErrorMessage('');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    const { error } = await sendPasswordResetEmail(email);
    setLoading(false);

    if (error) {
      setErrorMessage(translateError(error, 'No se pudo enviar el correo de recuperación.'));
    } else {
      setShowSuccessModal(true);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName="px-6 py-10 justify-center">

        <View className="items-center mb-6">
          <View className="w-24 h-24 mb-2">
            <AppLottie
              source={Animations.welcome}
              loop
            />
          </View>
          <Text className="text-2xl font-extrabold text-slate-900 tracking-tight text-center">
            Recuperar Contraseña
          </Text>
          <Text className="text-sm text-slate-500 text-center mt-1 px-4">
            Ingresa tu correo registrado para enviarte las instrucciones de restablecimiento
          </Text>
        </View>

        {errorMessage ? (
          <View className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-4 items-center gap-1">
            <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
            <Text className="text-xs text-red-600 font-medium text-center">
              {errorMessage}
            </Text>
          </View>
        ) : null}

        <View className="w-full">
          <Input
            label="Correo Electrónico"
            placeholder="ejemplo@correo.com"
            value={email}
            onChangeText={(v) => {
              setEmail(sanitizeEmail(v));
              setEmailError(null);
            }}
            maxLength={LIMITS.email.max}
            error={emailError}
            keyboardType="email-address"
            autoComplete="email"
            leftIcon={<Ionicons name="mail-outline" size={18} color="#64748b" />}
          />

          <Button
            title="Enviar Instrucciones"
            onPress={handleReset}
            isLoading={loading}
            className="w-full mt-2 mb-4"
          />

          <View className="flex-row items-center justify-center gap-1">
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              className="flex-row items-center gap-1.5 py-2">
              <Ionicons name="arrow-back" size={16} color="#2563eb" />
              <Text className="text-xs font-bold text-blue-600">
                Volver a Iniciar Sesión
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <ModalFeedback
        visible={showSuccessModal}
        title="Correo Enviado"
        message="Hemos enviado un enlace a tu bandeja de correo para restablecer tu contraseña."
        onClose={() => {
          setShowSuccessModal(false);
          router.replace('/(auth)/login');
        }}
      />
    </View>
  );
}
