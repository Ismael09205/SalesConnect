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
import { PasswordRequirements } from '@/components/ui/password-requirements';
import { Animations } from '@/constants/animations';
import {
  LIMITS,
  sanitizeEmail,
  sanitizeName,
  sanitizePassword,
  translateError,
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirmation,
} from '@/lib/validation';

type Field = 'nombre' | 'email' | 'password' | 'confirmPassword';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUpWithEmail } = useAuth();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string | null>>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const clearError = (field: Field) => setFieldErrors((prev) => ({ ...prev, [field]: null }));

  const handleRegister = async () => {
    const errors = {
      nombre: validateName(nombre),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validatePasswordConfirmation(password, confirmPassword),
    };
    setFieldErrors(errors);

    if (Object.values(errors).some(Boolean)) {
      setErrorMessage('Revisa los campos marcados en rojo.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    const { error } = await signUpWithEmail(email, password, nombre);
    setLoading(false);

    if (error) {
      setErrorMessage(translateError(error, 'No se pudo crear la cuenta. Inténtalo de nuevo.'));
    } else {
      setShowSuccessModal(true);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName="px-6 py-10 justify-center">

        {/* Hero con Animación Lottie */}
        <View className="items-center mb-6">
          <View className="w-28 h-28 mb-2">
            <AppLottie
              source={Animations.userProfile}
              loop
            />
          </View>
          <Text className="text-2xl font-extrabold text-slate-900 tracking-tight text-center">
            Crear Nueva Cuenta
          </Text>
          <Text className="text-sm text-slate-500 text-center mt-1">
            Empieza a organizar a tus clientes y ventas hoy mismo
          </Text>
        </View>

        {/* Mensaje de Error */}
        {errorMessage ? (
          <View className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-4 items-center gap-1">
            <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
            <Text className="text-xs text-red-600 font-medium text-center">
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {/* Formulario */}
        <View className="w-full">
          <Input
            label="Nombre Completo"
            placeholder="Ej. Juan Pérez"
            value={nombre}
            onChangeText={(v) => {
              setNombre(sanitizeName(v));
              clearError('nombre');
            }}
            maxLength={LIMITS.nombre.max}
            autoCapitalize="words"
            autoComplete="name"
            hint="Solo letras y espacios"
            error={fieldErrors.nombre}
            leftIcon={<Ionicons name="person-outline" size={18} color="#64748b" />}
          />

          <Input
            label="Correo Electrónico"
            placeholder="ejemplo@correo.com"
            value={email}
            onChangeText={(v) => {
              setEmail(sanitizeEmail(v));
              clearError('email');
            }}
            maxLength={LIMITS.email.max}
            keyboardType="email-address"
            autoComplete="email"
            error={fieldErrors.email}
            leftIcon={<Ionicons name="mail-outline" size={18} color="#64748b" />}
          />

          <Input
            label="Contraseña"
            placeholder={`Mínimo ${LIMITS.password.min} caracteres`}
            value={password}
            onChangeText={(v) => {
              setPassword(sanitizePassword(v));
              clearError('password');
            }}
            maxLength={LIMITS.password.max}
            isPassword
            autoComplete="new-password"
            error={fieldErrors.password}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#64748b" />}
          />

          <PasswordRequirements password={password} />

          <Input
            label="Confirmar Contraseña"
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChangeText={(v) => {
              setConfirmPassword(sanitizePassword(v));
              clearError('confirmPassword');
            }}
            maxLength={LIMITS.password.max}
            isPassword
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
            leftIcon={<Ionicons name="shield-checkmark-outline" size={18} color="#64748b" />}
          />

          <Button
            title="Crear Cuenta"
            onPress={handleRegister}
            isLoading={loading}
            className="w-full mt-2 mb-4"
          />

          {/* Enlace a Login */}
          <View className="flex-row items-center justify-center gap-1">
            <Text className="text-xs text-slate-500">¿Ya tienes cuenta?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text className="text-xs font-bold text-blue-600">
                Inicia sesión
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Modal de Éxito con Lottie profile created */}
      <ModalFeedback
        visible={showSuccessModal}
        title="¡Cuenta Creada con Éxito!"
        message="Tu cuenta se ha creado correctamente. Ya puedes iniciar sesión con tu correo y contraseña."
        lottieSource={Animations.profileCreated}
        freezeAtFrame={110}
        onClose={() => {
          setShowSuccessModal(false);
          router.replace('/(auth)/login');
        }}
      />
    </View>
  );
}
