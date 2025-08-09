import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomNavigation, Text } from 'react-native-paper';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Menu tab
const menus: {
  key: string;
  title: string;
  icon: any;
  routeName: string;
}[] = [
    { key: 'home', title: 'Home', icon: 'home', routeName: 'HomeScreen' },
    { key: 'ai', title: 'AI', icon: 'format-list-bulleted', routeName: 'AIScreen' }, // replaced 'list-alt'
    { key: 'gallery', title: 'Gallery', icon: 'compass', routeName: 'GalleryScreen' },
    { key: 'profile', title: 'Profile', icon: 'person', routeName: 'ProfileScreen' },
  ];
// Dummy screen renderer untuk contoh
const HomeRoute = () => <View style={styles.scene}><Text>Home Screen</Text></View>;
const AIRoute = () => <View style={styles.scene}><Text>AI Screen</Text></View>;
const GalleryRoute = () => <View style={styles.scene}><Text>Gallery Screen</Text></View>;
const ProfileRoute = () => <View style={styles.scene}><Text>Profile Screen</Text></View>;

// Mapping key → komponen
const scenes: Record<string, React.ComponentType<any>> = {
  home: HomeRoute,
  ai: AIRoute,
  gallery: GalleryRoute,
  profile: ProfileRoute,
};

export default function StackBottomTabBar() {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [routes] = useState(
    menus.map(menu => ({
      key: menu.key,
      title: menu.title,
      icon: ({ color, size }: { color: string; size: number }) => (
        <MaterialDesignIcons name={menu.icon} size={size} color={color} />
      ),
    }))
  );

  const renderScene = BottomNavigation.SceneMap(
    menus.reduce((acc, menu) => {
      acc[menu.key] = scenes[menu.key];
      return acc;
    }, {} as Record<string, React.ComponentType<any>>)
  );

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      shifting={false} // kalau mau efek shifting, ubah ke true
      sceneAnimationEnabled
      barStyle={{
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        overflow: 'hidden',
        paddingBottom: insets.bottom > 0 ? insets.bottom - 5 : 0,
      }}
    />
  );
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
