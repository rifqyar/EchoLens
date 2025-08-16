const initialState = {
  device: {},
}

interface Action {
  type: string;
  payload: any;
}

export default (state = initialState, action: Action) => {
  const { type, payload } = action
  switch (type) {
    case 'CONNECT_DEVICE':
      return {
        ...state,
        device: payload,
      };
    case 'DISCONNET_DEVICE':
      return {
        ...state,
        device: {},
      };
    default:
      return state;
  }
};