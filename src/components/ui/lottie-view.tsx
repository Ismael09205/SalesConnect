import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

interface AppLottieProps {
  source: any;
  style?: ViewStyle;
  autoPlay?: boolean;
  loop?: boolean;
  speed?: number;
  /**
   * Reproduce la animación desde el frame 0 hasta este frame y se congela ahí.
   * Útil cuando los últimos fotogramas "destruyen" la escena
   * (p. ej. la carpeta verde del perfil creado se desvanece al final).
   */
  freezeAtFrame?: number;
}

export function AppLottie({
  source,
  style,
  autoPlay = true,
  loop = true,
  speed = 1,
  freezeAtFrame,
}: AppLottieProps) {
  const isFrozen = freezeAtFrame != null;

  // Recorta la composición para que su último frame sea `freezeAtFrame`.
  // Así Lottie termina de forma natural en ese frame y se queda ahí,
  // sin depender de play(start, end) ni de eventos nativos de carga.
  // `op` es exclusivo, por eso se suma 1.
  const animationSource = useMemo(() => {
    if (!isFrozen || typeof source !== 'object' || source == null || !('op' in source)) {
      return source;
    }
    return { ...source, op: Math.min(source.op, freezeAtFrame + 1) };
  }, [source, freezeAtFrame, isFrozen]);

  return (
    <View style={[styles.container, style]}>
      <LottieView
        source={animationSource}
        autoPlay={isFrozen || autoPlay}
        loop={!isFrozen && loop}
        speed={speed}
        style={styles.lottie}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
});
