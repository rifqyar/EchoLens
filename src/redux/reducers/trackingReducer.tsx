const initialState = {
  tracking: null,
  summary: null,
  history: null,
}

interface Action {
  type: string;
  payload: any;
}

export default (state = initialState, action: Action) => {
  const { type, payload } = action
  switch (type) {
    case 'SET_SUMMARY':
      return {
        ...state,
        summary: payload,
      };
    case 'SET_TRACKING':
      return {
        ...state,
        tracking: payload,
      };
    case 'SET_HISTORY':
      return {
        ...state,
        history: payload,
      };
    default:
      return state;
  }
};