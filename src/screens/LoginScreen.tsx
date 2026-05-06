import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { ScreenLayout } from '../components/layout/ScreenLayout'
import { Button, Snackbar, useTheme } from 'react-native-paper'
import { RouteProp, useIsFocused } from '@react-navigation/native'
import { SectionLayout } from '../components/layout/SectionLayout'
import { Section } from 'react-native-paper/lib/typescript/components/Drawer/Drawer'
import { StackNavigationProp } from '@react-navigation/stack'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import { useDispatch } from 'react-redux'
import { loading, notLoading } from '../redux/actions/loadingAction'
import LoadingScreen from '../components/common/LoadingScreen'
import { useAppDispatch, useAppSelector } from '../redux/store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppleButton, appleAuth } from '@invertase/react-native-apple-authentication';
import { COLORS } from '../assets/theme'
import { jwtDecode } from 'jwt-decode';

// @ts-ignore
import { decode as atob } from 'base-64';
(global as any).atob = atob;

type RootStackParamList = {
  Login: undefined
  Main: undefined;
}

// Tipe data untuk user
interface User {
  id?: number
  email?: string
  name?: string
  photo?: number
}


type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>
type LoginScreenRouteProp = RouteProp<RootStackParamList, 'Login'>

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp
  route: LoginScreenRouteProp
}

type NotifState = {
  visible: boolean,
  text: string
}

// tipe untuk decoded JWT
interface DecodedToken {
  email?: string;
  [key: string]: any;
}

// tipe untuk update state callback
type UpdateCredentialStateFn = (state: string) => void;

// simpan user info sementara
let userId: string = 'unknown';
let userName: string = 'unknown';
let userEmail: string = 'unknown';

/**
 * Fetches the credential state for the current user, if any, and updates state on completion.
 */
async function fetchAndUpdateCredentialState(
  updateCredentialStateForUser: UpdateCredentialStateFn
): Promise<void> {
  if (userId === 'unknown') {
    updateCredentialStateForUser('User not signed in.');
  } else {
    const credentialState = await appleAuth.getCredentialStateForUser(userId);
    if (credentialState === appleAuth.State.AUTHORIZED) {
      updateCredentialStateForUser('AUTHORIZED');
    } else {
      updateCredentialStateForUser(String(credentialState));
    }
  }
}

/**
 * Starts the Sign In flow.
 */
export async function onAppleButtonPress(
  updateCredentialStateForUser: UpdateCredentialStateFn,
  dispatch: any,
  navigation: any
): Promise<void> {
  console.warn('Beginning Apple Authentication');

  try {
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
    });

    console.log('appleAuthRequestResponse', appleAuthRequestResponse);

    const {
      user: newUser,
      email,
      fullName,
      identityToken,
      nonce,
      realUserStatus,
    } = appleAuthRequestResponse;

    userId = newUser;
    userEmail = email ?? 'unknown';
    userName =
      fullName?.givenName && fullName?.familyName
        ? `${fullName.givenName} ${fullName.familyName}`
        : 'unknown';

    // decode JWT untuk ambil email jika tidak ada dari Apple
    if (identityToken) {
      const decoded: DecodedToken = jwtDecode(identityToken);
      console.log('decoded token: ', decoded);

      if (userEmail === 'unknown' && decoded.email) {
        userEmail = decoded.email;
      }
    }

    await fetchAndUpdateCredentialState(updateCredentialStateForUser);

    if (identityToken) {
      // contoh: login Firebase pakai nonce + identityToken
      console.log('Firebase login', nonce, identityToken);
    } else {
      console.warn('No identityToken, sign-in failed?');
    }

    if (realUserStatus === appleAuth.UserStatus.LIKELY_REAL) {
      console.log("I'm a real person!");
    }

    console.warn(`Apple Authentication Completed, ${userId}, ${email}`);

    const dataUser = {
      id: userId,
      email: email,
      name: userName,
      photo: null,
      provider: 'apple'
    }

    await AsyncStorage.setItem(
      'user',
      JSON.stringify(dataUser)
    )

    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user: dataUser },
    })

    navigation.navigate('Main');
  } catch (error: any) {
    if (error.code === appleAuth.Error.CANCELED) {
      console.warn('User canceled Apple Sign in.');
    } else {
      console.error(error);
    }
  }
}

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const theme = useTheme()
  const isFocused = useIsFocused()
  const dispatch = useDispatch()
  const isLoading = useAppSelector(
    (store) => store.loading.loading
  )

  const [notifVisible, setNotifVisible] = useState<NotifState>({
    visible: false,
    text: ''
  })

  const onDismissNotif = () => setNotifVisible({
    visible: false,
    text: ''
  })

  const [credentialStateForUser, updateCredentialStateForUser] = useState<string>('unknown');

  useEffect(() => {
    if (!appleAuth.isSupported) return;

    fetchAndUpdateCredentialState(updateCredentialStateForUser).catch((error: any) =>
      updateCredentialStateForUser(`Error: ${error.code ?? 'Unknown error'}`),
    );
  }, []);

  useEffect(() => {
    if (!appleAuth.isSupported) return;

    // listener revoke
    const revokeListener = appleAuth.onCredentialRevoked(async () => {
      console.warn('Credential Revoked');
      fetchAndUpdateCredentialState(updateCredentialStateForUser).catch((error: any) =>
        updateCredentialStateForUser(`Error: ${error.code ?? 'Unknown error'}`),
      );
    });

    // cleanup listener saat unmount
    return revokeListener;
  }, []);

  const webClientId = process.env.GOOGLE_WEBCLIENT_ID

  useEffect(() => {
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor('transparent');
    StatusBar.setBarStyle('light-content');
  }, [isFocused])

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: webClientId,
      iosClientId: '403993697553-j0d3m262f1lljgdrkolgaeubin7pl90l.apps.googleusercontent.com'
    })
  }, [])

  const googleLogin = async () => {
    dispatch(loading())
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      console.log(userInfo.type)
      if (userInfo.type == 'cancelled') {
        setNotifVisible({
          visible: true,
          text: 'User Cancelled Login'
        })
      } else {
        const user = userInfo.data?.user
        const dataUser = {
          id: user?.id,
          email: user?.email,
          name: user?.familyName + ' ' + user?.givenName,
          photo: user?.photo,
          provider: 'google'
        }

        await AsyncStorage.setItem(
          'user',
          JSON.stringify(dataUser)
        )

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: dataUser },
        })

        navigation.navigate('Main');
      }
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

    dispatch(notLoading())
  };

  return (
    <ScreenLayout withBackgroundImg>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <SectionLayout>
          <Text style={styles.title}>Tact-ID</Text>
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

        {
          Platform.OS === 'ios' && (
            <SectionLayout style={{ alignItems: 'center' }} edges={['left', 'right']}>
              <Text style={{ color: COLORS.white }}>Or</Text>
              <AppleButton
                buttonStyle={AppleButton.Style.WHITE}
                buttonType={AppleButton.Type.SIGN_IN}
                style={{
                  width: '90%', // You must specify a width
                  height: 45, // You must specify a height
                  marginTop: 20,
                }}
                onPress={() => {
                  onAppleButtonPress(updateCredentialStateForUser, dispatch, navigation)
                }}
              />
            </SectionLayout>
          )
        }

        {/* <SectionLayout style={{ marginTop: 20 }} edges={['left', 'right']} >
          <Text style={{ textAlign: 'center', color: theme.colors.surface }}>
            Aplikasi ini masih dalam tahap pengembangan. Beberapa fitur mungkin belum tersedia.
          </Text>
        </SectionLayout> */}
        {isLoading && <LoadingScreen withBackground={true} />}
      </View>

      <Snackbar
        visible={notifVisible.visible}
        onDismiss={onDismissNotif}
        action={{
          label: 'Close',
          onPress: () => {
            setNotifVisible({
              visible: false,
              text: ''
            })
          },
        }}>
        {notifVisible.text ?? ''}
      </Snackbar>
    </ScreenLayout>
  )
}

export default LoginScreen

const styles = StyleSheet.create({
  title: {
    fontSize: 45,
    fontWeight: '900',
    color: '#adadadff',
    letterSpacing: 4,
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