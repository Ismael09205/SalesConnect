import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  ScrollViewProps,
  View,
} from 'react-native';

interface KeyboardScrollContextValue {
  onFieldFocus: (field: View | null) => void;
}

const KeyboardScrollContext = createContext<KeyboardScrollContextValue | null>(null);

/** Lo usa <Input> para avisar qué campo recibió el foco. */
export const useKeyboardScroll = () => useContext(KeyboardScrollContext);

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  /** Espacio libre que se deja entre el campo enfocado y el teclado. */
  extraOffset?: number;
}

/**
 * ScrollView que, al abrirse el teclado, añade espacio al final del contenido
 * y desplaza la vista para que el campo enfocado quede visible.
 * No usa módulos nativos extra, así que funciona en Expo Go.
 */
export function KeyboardAwareScrollView({
  children,
  extraOffset = 24,
  onScroll,
  ...props
}: KeyboardAwareScrollViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const containerRef = useRef<View>(null);
  const scrollY = useRef(0);
  const focusedField = useRef<View | null>(null);
  const keyboardTop = useRef<number | null>(null);
  const [bottomSpace, setBottomSpace] = useState(0);

  const ensureFieldVisible = useCallback(() => {
    const field = focusedField.current;
    const container = containerRef.current;
    if (!field || !container) return;

    container.measureInWindow((_cx, containerY, _cw, containerH) => {
      field.measureInWindow((_fx, fieldY, _fw, fieldH) => {
        const visibleTop = containerY + extraOffset;
        const visibleBottom =
          Math.min(containerY + containerH, keyboardTop.current ?? Infinity) - extraOffset;

        let delta = 0;
        if (fieldY + fieldH > visibleBottom) delta = fieldY + fieldH - visibleBottom;
        else if (fieldY < visibleTop) delta = fieldY - visibleTop;

        if (delta !== 0) {
          scrollRef.current?.scrollTo({ y: Math.max(0, scrollY.current + delta), animated: true });
        }
      });
    });
  }, [extraOffset]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      keyboardTop.current = e.endCoordinates.screenY;
      containerRef.current?.measureInWindow((_x, y, _w, h) => {
        // Solo la parte del ScrollView que realmente tapa el teclado
        setBottomSpace(Math.max(0, y + h - e.endCoordinates.screenY));
        // Espera a que se aplique el espacio extra antes de desplazar
        setTimeout(ensureFieldVisible, Platform.OS === 'ios' ? 250 : 120);
      });
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardTop.current = null;
      setBottomSpace(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [ensureFieldVisible]);

  const onFieldFocus = useCallback(
    (field: View | null) => {
      focusedField.current = field;
      // Si el teclado ya estaba abierto (cambio de un campo a otro), desplaza de inmediato
      if (keyboardTop.current != null) setTimeout(ensureFieldVisible, 50);
    },
    [ensureFieldVisible]
  );

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
    onScroll?.(e);
  };

  return (
    <KeyboardScrollContext.Provider value={{ onFieldFocus }}>
      <View ref={containerRef} className="flex-1" collapsable={false}>
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={handleScroll}
          {...props}>
          {children}
          <View style={{ height: bottomSpace }} />
        </ScrollView>
      </View>
    </KeyboardScrollContext.Provider>
  );
}
