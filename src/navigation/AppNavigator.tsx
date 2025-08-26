import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { memo, useEffect, useRef } from 'react'
import { Alert, BackHandler, Image, View } from 'react-native'
import LoginScreen from '../screens/LoginScreen'
import { TabNavigator } from './TabNavigator'
import StackBottomTabBar from '../components/layout/StackBottomTabBar'
import LiveControlScreen from '../screens/LiveControlScreen'
import PairDeviceScreenOnBoard from '../screens/PairDeviceScreenOnBoard'
import PairDeviceScreen from '../screens/PairDeviceScreen'
import ScanDevicesScreen from '../screens/ScanDeviceScreen'
import React from 'react'
import HomeScreen from '../screens/HomeScreen'
import { COLORS } from '../assets/theme'
import VoiceToTextScreen from '../screens/VoiceToText'
import BottomTabBar from '../components/layout/BottomTabBar'

type MainStackParamList = {
  Login: undefined
  Main: undefined
  LiveControl: undefined
  PairDeviceOnBoard: undefined
  PairDeviceScreen: undefined
  ScanDeviceScreen: undefined
  VoiceToTextScreen: undefined
}

const MainStack =
  createStackNavigator<MainStackParamList>()

// Main App Navigator
const AppNavigator = memo(
  (props: { isLoggedIn: boolean }) => {
    const { isLoggedIn } = props

    const navigationRef =
      useRef<NavigationContainerRef<any>>(null)
    const routeNameRef = useRef<string | undefined>(
      undefined
    )

    const backAction = () => {
      if (
        routeNameRef.current == 'Home' ||
        routeNameRef.current == 'Login'
      ) {
        Alert.alert(
          'Hold on!',
          'Are you sure you want to exit app?',
          [
            {
              text: 'Cancel',
              onPress: () => {
                return true
              },
              style: 'cancel',
            },
            {
              text: 'YES',
              onPress: () => BackHandler.exitApp(),
            },
          ]
        )
        return true
      }
    }

    useEffect(() => {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      )
      console.log(backHandler)
      return () => {
        backHandler.remove()
      }
    }, [])

    const mainStackOptions = {
      headerShown: false,
      animation: 'fade_from_bottom' as const,
      headerShadowVisible: false,
    }

    return (
      <NavigationContainer
        ref={navigationRef}
        onReady={() =>
        (routeNameRef.current =
          navigationRef.current?.getCurrentRoute()?.name)
        }
        onStateChange={async () => {
          const currentRouteName =
            navigationRef.current?.getCurrentRoute()?.name
          routeNameRef.current = currentRouteName
        }}
      >
        <MainStack.Navigator
          screenOptions={mainStackOptions}
          initialRouteName={isLoggedIn ? 'Main' : 'Login'}
        >
          <MainStack.Screen
            name="Login"
            component={LoginScreen}
          />
          <MainStack.Screen
            name={'Main'}
            // component={HomeScreen}
            // options={{
            //   headerTitleAlign: 'left',
            //   headerTitle: () => <MemoizedHomeHeader />,
            //   headerStyle: {
            //     backgroundColor: COLORS.background, // warna header
            //   },
            //   title: 'Home',
            //   headerShown: true
            // }}
            children={() => (
              <BottomTabBar />
            )}
            options={{ headerShown: false }}
          />
          <MainStack.Screen
            name={'PairDeviceOnBoard'}
            component={PairDeviceScreenOnBoard}
          />
          <MainStack.Screen
            name={'ScanDeviceScreen'}
            component={ScanDevicesScreen}
          />
          <MainStack.Screen
            name={'PairDeviceScreen'}
            component={PairDeviceScreen}
          />
          <MainStack.Screen
            name={'LiveControl'}
            component={LiveControlScreen}
          />
          <MainStack.Screen
            name={'VoiceToTextScreen'}
            component={VoiceToTextScreen}
          />
        </MainStack.Navigator>
      </NavigationContainer>
    )
  }
)

export default AppNavigator