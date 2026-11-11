import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyboardAwareScrollView } from '@/components/ui/keyboard-aware-scroll-view';
import { AppLottie } from '@/components/ui/lottie-view';
import { Animations } from '@/constants/animations';
import { LIMITS, sanitizeEmail, translateError, validateEmail } from '@/lib/validation';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSuccessLoading, setIsSuccessLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string | null; password?: string | null }>({});

  const handleLogin = async () => {
    const errors = {
      email: validateEmail(email),
      password: password ? null : 'Ingresa tu contraseña.',
    };
    setFieldErrors(errors);
    if (errors.email || errors.password) {
      setErrorMessage('');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    const { error } = await signInWithEmail(email, password);
    setLoading(false);

    if (error) {
      setErrorMessage(translateError(error, 'No se pudo iniciar sesión. Inténtalo de nuevo.'));
    } else {
      setIsSuccessLoading(true);
      setTimeout(() => {
        router.replace('/(app)');
      }, 1200);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setGoogleLoading(true);

    const { error, cancelled } = await signInWithGoogle();
    setGoogleLoading(false);

    if (cancelled) return;

    if (error) {
      setErrorMessage(translateError(error, 'No se pudo iniciar sesión con Google.'));
    } else {
      setIsSuccessLoading(true);
      setTimeout(() => {
        router.replace('/(app)');
      }, 1200);
    }
  };

  // Pantalla de Transición / Loading Animation tras ingresar sesión correctamente
  if (isSuccessLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-6">
        <View className="w-48 h-48 mb-4">
          <AppLottie
            source={Animations.loading}
            loop
          />
        </View>
        <Text className="text-xl font-extrabold text-slate-900 text-center tracking-tight">
          ¡Bienvenido de nuevo!
        </Text>
        <Text className="text-sm text-slate-500 text-center mt-1">
          Preparando tu panel de control...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName="px-6 py-10 justify-center">

        {/* Hero con Animación Lottie: Welcome (750x500, se respeta su proporción) */}
        <View className="items-center mb-6">
          <View className="w-full max-w-md mb-2" style={{ aspectRatio: 750 / 500 }}>
            <AppLottie
              source={Animations.welcome}
              loop
            />
          </View>
          <Text className="text-3xl font-extrabold text-slate-900 tracking-tight text-center">
            SalesConnect
          </Text>
          <Text className="text-sm text-slate-500 text-center mt-1 px-4">
            Gestiona clientes, ventas e interacciones en un solo lugar
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
            label="Correo Electrónico"
            placeholder="ejemplo@correo.com"
            value={email}
            onChangeText={(v) => {
              setEmail(sanitizeEmail(v));
              setFieldErrors((prev) => ({ ...prev, email: null }));
            }}
            maxLength={LIMITS.email.max}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            error={fieldErrors.email}
            leftIcon={<Ionicons name="mail-outline" size={18} color="#64748b" />}
          />

          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setFieldErrors((prev) => ({ ...prev, password: null }));
            }}
            maxLength={LIMITS.password.max}
            isPassword
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            error={fieldErrors.password}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#64748b" />}
          />

          <View className="items-center mb-4">
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text className="text-xs font-semibold text-blue-600 text-center">
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Iniciar Sesión"
            onPress={handleLogin}
            isLoading={loading}
            className="w-full mb-3"
          />

          {/* Separador */}
          <View className="flex-row items-center my-4">
            <View className="flex-1 h-px bg-slate-200" />
            <Text className="mx-3 text-xs text-slate-400 font-medium uppercase text-center">
              o continúa con
            </Text>
            <View className="flex-1 h-px bg-slate-200" />
          </View>

          {/* Social Login con Google */}
          <Button
            title="Continuar con Google"
            variant="google"
            onPress={handleGoogleLogin}
            isLoading={googleLoading}
            leftIcon={<Ionicons name="logo-google" size={18} color="#ea4335" />}
            className="w-full mb-6"
          />

          {/* Enlace a Registro */}
          <View className="flex-row flex-wrap items-center justify-center gap-1">
            <Text className="text-xs text-slate-500 text-center">¿No tienes una cuenta?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text className="text-xs font-bold text-blue-600">
                Regístrate aquí
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
