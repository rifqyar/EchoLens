const initialState = {
  user: false,
}

const userReducer = (state = initialState, action) => {
  const { type, payload } = action
  switch (type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoggedIn: true,
        user: payload,
      }
    case 'LOGIN_FAIL':
      return {
        ...state,
        isLoggedIn: false,
        error: payload.message,
      }
    case 'LOGOUT':
      return {
        ...state,
        isLoggedIn: false,
        user: null,
      }
    case 'SET_USER':
      return {
        ...state,
        isLoggedIn: payload.isLoggedIn,
        user: payload,
      }
    case 'CLEAR_AUTH_STATE':
      return {
        ...state,
        isLoggedIn: false,
        user: null,
      }
    default:
      return state
  }
}

export default userReducer
