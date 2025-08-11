import AsyncStorage from '@react-native-async-storage/async-storage'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import axios from 'axios'
import { axios as axiosLib } from '../../lib/axios'
import { Dispatch } from 'redux'
import { api_url } from '../../../app.json'
import {
  LOGIN_SUCCESS,
  SET_USER,
} from '../../contexts/actionTypes'
import { loading, notLoading } from './loadingAction'
import { showSnackbar } from './snackbarAction'
import { LogLevel, OneSignal } from 'react-native-onesignal'
import store from '../store'

// Tipe data untuk user
interface User {
  ID?: number
  Username?: string
  Email?: string
  IsActive?: number
  RolesID?: number
  BranchID?: number
  token?: string
}

// Tipe data untuk response dari login API
interface LoginResponse {
  user?: User
  token?: string
  message?: string
  status?: string
}

// Tipe data untuk form login
interface LoginFormValue {
  username: string
  password: string
}

// Action creator untuk set user
export const setUser =
  (payload: {
    user: User | null
    token?: string
    isLoggedIn?: boolean
  }) =>
    (dispatch: Dispatch) => {
      console.log(payload)
      dispatch({
        type: SET_USER,
        payload: {
          isLoggedIn: payload.isLoggedIn,
          user: payload.user,
          payload: payload.token,
        },
      })
      return payload.user
    }


const getOneSignalPushSubscriptionId = async () => {
  try {
    const pushSubscriptionId = OneSignal.User.pushSubscription.getIdAsync();
    if (pushSubscriptionId) {
      return pushSubscriptionId;
    } else {
      OneSignal.Debug.setLogLevel(LogLevel.Verbose);
      OneSignal.initialize(process.env.ONESIGNAL_APPID || '');
      OneSignal.Notifications.requestPermission(false);
    }
  } catch (error) {
    return null;
  }
};
// Action creator untuk login
export const login =
  (
    formValue: LoginFormValue,
    navigation: NativeStackNavigationProp<any>
  ) =>
    async (dispatch: Dispatch) => {
      dispatch(loading())
      try {
        const response = await axios.post<LoginResponse>(
          `${process.env.API_URL}/login`,
          formValue,
          {
            headers: {
              Accept: 'application/json',
            },
          }
        )

        const { user, token } = response.data
        const dataUser: User = { ...user, token }
        await AsyncStorage.setItem(
          'user',
          JSON.stringify(dataUser)
        )

        dispatch({
          type: LOGIN_SUCCESS,
          payload: { user: dataUser },
        })

        const onesignalId = await getOneSignalPushSubscriptionId();
        if (onesignalId) {
          updateOneSignalId(response.data.user?.ID, onesignalId, token);
        }

        setTimeout(() => {
          dispatch(notLoading())
          navigation.push('Home')
        }, 1000)
      } catch (error: any) {
        dispatch(notLoading())
        if (axios.isAxiosError(error)) {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            'Login failed'
          console.error('Login error:', errorMessage)
          dispatch(
            showSnackbar({
              visible: true,
              text: errorMessage,
              isError: true,
            })
          )
        } else {
          console.error('Login error:', error)
          dispatch(
            showSnackbar({
              visible: true,
              text: 'Login failed',
              isError: true,
            })
          )
        }
      }
    }

export const updateOneSignalId = async (userId: any, onesignalId: string, token: any) => {
  const formData = new FormData();
  formData.append('onesignal_id', onesignalId);
  try {
    const { data } = await axios.patch(
      `${process.env.API_URL}/api/user/onesignal-id/${userId}`,
      formData,
      {
        headers: {
          Authorization: `${token}`,
          // Accept: 'Application/json',
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log(data);
    return true;
  } catch (error: any) {
    console.log(error);
    return false;
  }
}