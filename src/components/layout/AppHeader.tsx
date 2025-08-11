import React, { PropsWithChildren } from 'react';
import { StyleProp, ViewStyle, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Appbar, useTheme } from 'react-native-paper';

type AppHeaderProps = PropsWithChildren & {
  goBackNavigation?: () => void;
  withBack?: boolean;
  title?: string;
  style?: StyleProp<ViewStyle>;
};

export const AppHeader = (props: AppHeaderProps) => {
  const navigation = useNavigation();
  const theme = useTheme();

  return (
    <Appbar.Header
      style={[
        {
          // paddingTop: (StatusBar.currentHeight ?? 0), // Sesuaikan untuk Android
          backgroundColor: theme.colors.secondary,
        },
        props.style]}
    >
      {props.withBack && (
        <Appbar.BackAction
          color={theme.colors.onSecondary}
          onPress={() =>
            props.goBackNavigation
              ? props.goBackNavigation()
              : navigation.goBack()
          }
        />
      )}
      {props.title && <Appbar.Content color={theme.colors.onSecondary} title={props.title} />}
      {props.children}
    </Appbar.Header>
  );
};
