import MaterialDesignIcons, { MaterialDesignIconsIconName } from '@react-native-vector-icons/material-design-icons';
import React, { memo, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { BottomNavigation, Text, useTheme } from 'react-native-paper';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../../screens/HomeScreen';
import { createStackNavigator } from '@react-navigation/stack';
import GalleryScreen from '../../screens/GalleryScreen';

// Menu tab
const menus: {
  key: string;
  title: string;
  icon: MaterialDesignIconsIconName;
  routeName: string;
}[] = [
    { key: 'home', title: 'Home', icon: 'home', routeName: 'HomeScreen' },
    // { key: 'ai', title: 'AI', icon: 'robot-excited', routeName: 'AIScreen' }, // replaced 'list-alt'
    { key: 'gallery', title: 'Gallery', icon: 'image', routeName: 'GalleryScreen' },
    { key: 'profile', title: 'Profile', icon: 'account', routeName: 'ProfileScreen' },
  ];

const Stack = createStackNavigator();
const HomeScreenStack = () => {
  const theme = useTheme();
  const MemoizedHomeHeader = memo(() => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "space-between", width: '100%' }}>
        <View>
          <Image
            source={require('../../assets/img/logo-full.png')}
            style={{
              width: 130,
              resizeMode: 'contain',
              marginLeft: 0,
            }}
          />
        </View>
      </View>
    )
  })

  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{
        headerTitleAlign: 'left',
        headerTitle: () => <MemoizedHomeHeader />,
        headerStyle: {
          backgroundColor: theme.colors.secondary, // warna header
        },
        title: 'Home',
      }} />
    </Stack.Navigator>
  )
}
const AIRoute = () => <View style={styles.scene}><Text>AI Screen</Text></View>;
// const GalleryRoute = () => <View style={styles.scene}><Text>Gallery Screen</Text></View>;
const ProfileRoute = () => <View style={styles.scene}><Text>Profile Screen</Text></View>;

// Mapping key → komponen
const scenes: Record<string, React.ComponentType<any>> = {
  home: HomeScreenStack,
  ai: AIRoute,
  gallery: GalleryScreen,
  profile: ProfileRoute,
};

export default function StackBottomTabBar({ initRouteName }: any) {
  console.log(initRouteName)
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initRouteName);
  // const [routes] = useState(
  //   menus.map(menu => ({
  //     key: menu.key,
  //     title: menu.title,
  //     icon: ({ color, size }: { color: string; size: number }) => (
  //       <MaterialDesignIcons name={menu.icon} size={size} color={color} />
  //     ),
  //   }))
  // );
  const [routes] = useState(
    menus.map(menu => ({
      key: menu.key,
      title: menu.title,
      icon: menu.icon, // Pass icon name directly, let BottomNavigation handle rendering
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
      renderIcon={({ route }: any) => (
        <MaterialDesignIcons name={route.icon} size={28} color={theme.colors.surface} />
      )}
      shifting={false} // kalau mau efek shifting, ubah ke true
      sceneAnimationEnabled
      activeColor="#fff"      // warna teks/icon aktif
      inactiveColor="#fff"    // warna teks/icon tidak aktif
      activeIndicatorStyle={{
        backgroundColor: theme.colors.primary, // warna garis bawah aktif
        padding: 30,
        marginTop: 25
      }}
      barStyle={{
        // borderTopLeftRadius: 35,
        // borderTopRightRadius: 35,
        overflow: 'hidden',
        paddingBottom: insets.bottom > 0 ? insets.bottom - 25 : 0,
        backgroundColor: theme.colors.secondary,
      }}
    />
  );
};

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});