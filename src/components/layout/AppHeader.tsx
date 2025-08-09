import React, { PropsWithChildren } from 'react';
import { StyleProp, ViewStyle, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Appbar } from 'react-native-paper';

type AppHeaderProps = PropsWithChildren & {
  goBackNavigation?: () => void;
  withBack?: boolean;
  title?: string;
  style?: StyleProp<ViewStyle>;
};

export const AppHeader = (props: AppHeaderProps) => {
  const navigation = useNavigation();

  return (
    <Appbar.Header
      style={[
        {
          paddingTop: (StatusBar.currentHeight ?? 0), // Sesuaikan untuk Android
        },
        props.style as any,
      ]}
    >
      {props.withBack && (
        <Appbar.BackAction
          onPress={() =>
            props.goBackNavigation
              ? props.goBackNavigation()
              : navigation.goBack()
          }
        />
      )}
      {props.title && <Appbar.Content title={props.title} />}
      {props.children}
    </Appbar.Header>
  );
};
