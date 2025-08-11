import { Dispatch } from "@reduxjs/toolkit";
import { loading, notLoading } from "./loadingAction";
import { axios } from "../../lib/axios";
import { showSnackbar } from "./snackbarAction";
import { AxiosError, isAxiosError } from "axios";
import { SET_USER } from "../../contexts/actionTypes";
import AsyncStorage from "@react-native-async-storage/async-storage";

// redux/actions/countAction.js
interface Data {
  data: any;
}

export const setData = (data: Data) => {
  return {
    type: 'SET_DATA',
    payload: data
  };
};

export const getDocumentList = (
  limit: number,
  nextPage: number
) =>
  async (dispatch: Dispatch) => {
    console.info('Getting Document List Data')

    dispatch(loading())
    try {
      const response = await axios.post(
        `${process.env.API_URL}/api/request-layanan-all`,
        {
          pagination: {
            limit,
            page: nextPage,
          },
        }
      )
      dispatch(notLoading())
      console.log(response.data)
      const data = response.data.data
      dispatch(setData(data))
    } catch (error: any) {
      dispatch(notLoading())
      if (isAxiosError(error)) {
        const axiosError = error as AxiosError<{
          message: string;
          details?: any;
        }>;

        if (axiosError.response) {
          console.error('Error Status', axiosError.response.status);
          if (axiosError.response.status == 401) {
            dispatch(
              showSnackbar({
                visible: true,
                text: 'User Token Expired',
                isError: true,
              })
            )

            dispatch({
              type: SET_USER,
              payload: { user: null, isLoggedIn: false },
            })

            AsyncStorage.clear()

            // navigation.navigate('Login', {})
          }
        } else if (axiosError.request) {
          console.error('Error Request', axiosError.request);
        } else {
          dispatch(
            showSnackbar({
              visible: true,
              text:
                axiosError.message ||
                'Gagal Mengambil Data',
              isError: true,
            })
          )
        }
      } else {
        console.error('An unexpected error occurred:', error);
      }
    }
  }