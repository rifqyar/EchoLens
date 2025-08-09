import React, { PropsWithChildren } from 'react';
import { StyleProp, View, ViewStyle, StyleSheet } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type SectionLayoutProps = PropsWithChildren & {
  title?: string | React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>; // SafeArea edges
  elevation?: number; // optional elevation
};

export const SectionLayout = ({
  title,
  style,
  children,
  edges = ['left', 'right'], // default hanya kiri-kanan supaya section bisa rapat ke atas/bawah
  elevation = 0,
}: SectionLayoutProps) => {
  const theme = useTheme();

  return (
    <SafeAreaView edges={edges} style={{ flex: 0 }}>
      <Surface style={[styles.container, style]} elevation={elevation as any}>
        {title ? (
          typeof title === 'string' ? (
            <View style={styles.titleWrapper}>
              <Text variant="titleMedium">{title}</Text>
              <View
                style={[
                  styles.titleUnderline,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
            </View>
          ) : (
            title
          )
        ) : null}

        {children}
      </Surface>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  titleWrapper: {
    paddingVertical: 12,
  },
  titleUnderline: {
    width: '30%',
    height: 2,
    borderRadius: 10,
    marginTop: 4,
  },
});
