import axios from 'axios'
import { loading, notLoading } from './loadingAction'
import { showSnackbar } from './snackbarAction'

export const postRequestLayanan =
  (navigation, payload, token) => async (dispatch) => {
    dispatch(loading())
    await axios
      .post(
        `${process.env.API_URL}/api/request-layanan1`,
        payload,
        {
          headers: {
            Authorization: `${token}`,
            // Accept: 'Application/json',
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      .then((response) => {
        console.log(response)
        dispatch(notLoading())
        dispatch(
          showSnackbar({
            visible: true,
            text: 'Berhasil Submit Dokumen Request Layanan',
            isError: false,
          })
        )

        navigation.navigate('ListDocument')
      })
      .catch((error) => {
        console.log(error)
        let err = error.response
        dispatch(notLoading())
        dispatch(
          showSnackbar({
            visible: true,
            text: err.data.message,
            isError: true,
          })
        )
      })
  }
