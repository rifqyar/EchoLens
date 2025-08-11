// redux/actions/countAction.js
export const showSnackbar = (props) => {
    return {
      type: 'SHOW_SNACKBAR',
      payload: {
        visible: props.visible,
        text: props.text,
        isError: props.isError,
      }
    };
  };
   
  export const hideSnackbar = () => {
    return {
      type: 'HIDE_SNACKBAR',
      payload: {
        visible: false,
        text: '',
        isError: false,
      }
    };
  };