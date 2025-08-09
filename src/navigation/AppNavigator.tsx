import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { memo, useEffect, useRef } from 'react'
import { Alert, BackHandler } from 'react-native'
import LoginScreen from '../screens/LoginScreen'
import { TabNavigator } from './TabNavigator'

type MainStackParamList = {
  Login: undefined
  Home: undefined
  Gallery: undefined
  Ai: undefined
  Profile: undefined
}

const MainStack =
  createStackNavigator<MainStackParamList>()

// Main App Navigator
const AppNavigator = memo(
  (props: { isLoggedIn: boolean }) => {
    const { isLoggedIn } = props
    console.log(props)
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
          initialRouteName={isLoggedIn ? 'Home' : 'Login'}
        >
          <MainStack.Screen
            name="Login"
            component={LoginScreen}
          />
          <MainStack.Screen
            name={'Home'}
            children={() => (
              <TabNavigator initRouteName={'HomeTab'} />
            )}
            options={{ headerShown: false }}
          />
        </MainStack.Navigator>
      </NavigationContainer>
    )
  }
)

export default AppNavigator