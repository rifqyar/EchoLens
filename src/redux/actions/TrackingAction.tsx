import { Dispatch } from "@reduxjs/toolkit";
import { loading, notLoading } from "./loadingAction";
import { axios } from "../../lib/axios";
import { showSnackbar } from "./snackbarAction";

// redux/actions/countAction.js
interface Data {
  data: any;
}
export const setTrackingData = (data: Data) => {
  return {
    type: 'SET_TRACKING',
    payload: data
  };
};
export const setSummaryData = (data: Data) => {
  return {
    type: 'SET_SUMMARY',
    payload: data
  };
};
export const setHistoryData = (data: Data) => {
  return {
    type: 'SET_HISTORY',
    payload: data
  };
};

export const getSummaryData = (
  no_cont: string
) =>
  async (dispatch: Dispatch) => {
    console.log('Getting Summary Data')
    dispatch(loading())
    try {
      const response = await axios.post(
        `${process.env.API_URL}/api/summary_kontainer`,
        {
          no_container: no_cont
        },
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      dispatch(notLoading())
      const data = response.data.data

      dispatch(setSummaryData(data))
    } catch (error: any) {
      dispatch(notLoading())
      dispatch(
        showSnackbar({
          visible: true,
          text:
            error?.response?.data?.message ||
            'Gagal Mengambil Data',
          isError: true,
        })
      )
    }
  }

export const getTrackingData = (no_cont: string, no_dok: string) => async (dispatch: Dispatch) => {
  console.info('Getting Tracking Data')
  dispatch(loading())
  try {
    const response = await axios.post(
      `${process.env.API_URL}/api/tracking_bydok`,
      {
        no_cont: no_cont,
        no_dok: no_dok
      },
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    dispatch(notLoading())
    const data = response.data.data
    dispatch(setTrackingData(data))
  } catch (error: any) {
    dispatch(notLoading())
    dispatch(
      showSnackbar({
        visible: true,
        text:
          error?.response?.data?.message ||
          'Gagal Mengambil Data',
        isError: true,
      })
    )
  }
}

export const getHistoryContainer = (no_cont: string, npwp: string) => async (dispatch: Dispatch) => {
  console.info('Getting History Data')
  dispatch(loading())
  try {
    const response = await axios.post(
      `${process.env.API_URL}/api/tracking_by_cont_n_npwp`,
      {
        no_cont: no_cont,
        npwp: npwp
      },
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    dispatch(notLoading())
    const data = response.data.data
    console.log(data)
    dispatch(setHistoryData(data))
  } catch (error: any) {
    dispatch(notLoading())
    dispatch(
      showSnackbar({
        visible: true,
        text:
          error?.response?.data?.message ||
          'Gagal Mengambil Data',
        isError: true,
      })
    )
  }
}