import { useEffect, useState } from 'react'
import { StatusBar } from 'react-native'
import { AppLoading } from '../components/layout/AppLoading'
import AppNavigator from '../navigation/AppNavigator'
// import BootSplash from "react-native-bootsplash";

interface RootState {
  user: null
}
const AppProvider = () => {
  const [isLoading, setLoading] = useState(true)
  const [tokenChecked, setTokenChecked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<any>(false)

  useEffect(() => {
    const init = async () => {
      await getUser()
    }
    getUser()

    // init().finally(async () => {
    //   await BootSplash.hide({ fade: true });
    //   console.log("BootSplash has been hidden successfully");
    // });
  }, [])

  const getUser = async () => {
    // try {
    //   var user = await AsyncStorage.getItem('user')
    //   if (user !== null) {
    //     checkToken()
    //   } else {
    //     let authState = { isLoggedIn: false, user: null }
    //     setTokenChecked(true)
    //     setIsLoggedIn(false)
    //     dispatch(setUser(authState))
    //     dispatch(notLoading())
    //   }
    // } catch (error) { }
  }

  const checkToken = async () => {
    // dispatch(loading())
    // const userString = await AsyncStorage.getItem('user')
    // let userObj: any = null
    // try {
    //   userObj = userString ? JSON.parse(userString) : null
    // } catch (e) {
    //   userObj = null
    // }

    // const tokenStorage = userObj?.token || ''
    // axios.get(
    //   `${process.env.API_URL}/auth/me`,
    //   {
    //     headers: {
    //       Authorization: tokenStorage,
    //     },
    //   }
    // ).then((response) => {
    //   const data = response.data
    //   dispatch(notLoading())
    //   if (data.message == 'Token is valid') {
    //     setIsLoggedIn(true)
    //     dispatch({
    //       type: SET_USER,
    //       payload: { user: userObj, isLoggedIn: true },
    //     })
    //   } else {
    //     setIsLoggedIn(false)

    //     dispatch({
    //       type: SET_USER,
    //       payload: { user: null, isLoggedIn: false },
    //     })
    //   }
    //   setTokenChecked(true)
    // }).catch(err => {
    //   const error = err.toJSON();
    //   console.error('Error checking token:', error);
    //   if (error.status == 401) {
    //     setIsLoggedIn(false);
    //     dispatch(
    //       showSnackbar({
    //         visible: true,
    //         text: 'Sesi login expired, harap login kembali!',
    //         isError: true,
    //       }),
    //     );
    //   } else {
    //     setIsLoggedIn(false);
    //     dispatch(notLoading());
    //     dispatch(
    //       showSnackbar({
    //         visible: true,
    //         text: 'Terjadi kesalahan, harap periksa koneksi internet anda',
    //         isError: true,
    //       }),
    //     );
    //   }

    //   dispatch(notLoading());
    // })
  }

  // const theme = useTheme()

  console.log('check token: ' + tokenChecked)
  console.log('login status: ' + isLoggedIn)
  if (isLoggedIn != null) {
    return (
      <>
        <StatusBar
          translucent={true}
          backgroundColor={'transparent'}
          barStyle="dark-content"
        />
        <AppNavigator isLoggedIn={isLoggedIn} />
        {/* Loading */}
        <AppLoading></AppLoading>
      </>
    )
  }
}

export default AppProvider