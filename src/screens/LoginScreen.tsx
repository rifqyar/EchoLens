import { StatusBar, StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import { ScreenLayout } from '../components/layout/ScreenLayout'
import { Button, useTheme } from 'react-native-paper'
import { RouteProp, useIsFocused } from '@react-navigation/native'
import { SectionLayout } from '../components/layout/SectionLayout'
import { Section } from 'react-native-paper/lib/typescript/components/Drawer/Drawer'
import { StackNavigationProp } from '@react-navigation/stack'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'

type RootStackParamList = {
  Login: undefined
  Main: undefined;
}

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>
type LoginScreenRouteProp = RouteProp<RootStackParamList, 'Login'>

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp
  route: LoginScreenRouteProp
}

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const theme = useTheme()
  const isFocused = useIsFocused()
  console.log(process.env.GOOGLE_WEBCLIENT_ID)
  const webClientId = process.env.GOOGLE_WEBCLIENT_ID || '195136459550-51p74b3v4fd6235m9tg9lgc4i90len3c.apps.googleusercontent.com'

  useEffect(() => {
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor(theme.colors.secondary);
    StatusBar.setBarStyle('dark-content');
  }, [isFocused])

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: webClientId,
    })
  }, [])

  const googleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log("userinfo", userInfo);

    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const err = error as { code: string };
        if (err.code === statusCodes.SIGN_IN_CANCELLED) {
          console.log(error)
        } else if (err.code === statusCodes.IN_PROGRESS) {
          console.log(error)
        } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          console.log(error)
        } else {
        }
      } else {
        console.log(error);
      }
    }
  };

  return (
    <ScreenLayout withBackgroundImg>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <SectionLayout>
          <Text style={styles.title}>ECHO LENS</Text>
          <Text style={styles.subtitle}>CONNECT, CREATE, CONTROL</Text>
        </SectionLayout>

        <SectionLayout style={{ marginTop: 20, alignItems: 'center' }} edges={['left', 'right']}>
          <Button
            mode="contained"
            onPress={googleLogin}
            style={{
              width: '90%',
              backgroundColor: theme.colors.primary,
              paddingVertical: 5,
            }}
            labelStyle={{ fontSize: 18, color: theme.colors.onPrimary }}
          >
            Login With Gmail
          </Button>
        </SectionLayout>

        <SectionLayout style={{ marginTop: 20 }} edges={['left', 'right']} >
          <Text style={{ textAlign: 'center', color: theme.colors.surface }}>
            Aplikasi ini masih dalam tahap pengembangan. Beberapa fitur mungkin belum tersedia.
          </Text>
        </SectionLayout>
      </View>
    </ScreenLayout>
  )
}

export default LoginScreen

const styles = StyleSheet.create({
  title: {
    fontSize: 45,
    fontWeight: '900',
    color: '#adadadff',
    letterSpacing: 3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    letterSpacing: 3,
    color: '#ffffff8f',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'thin'
  },
})