// redux/actions/countAction.js
export const loading = () => {
    return {
      type: 'LOADING_TRUE',
    };
  };
   
  export const notLoading = () => {
    return {
      type: 'LOADING_FALSE',
    };
  };