const initialState = {
  data: null,
}

interface Action {
  type: string;
  payload: any;
}

export default (state = initialState, action: Action) => {
  const { type, payload } = action
  switch (type) {
    case 'SET_DATA':
      return {
        ...state,
        data: payload,
      };
    default:
      return state;
  }
};