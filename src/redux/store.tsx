import {
  combineReducers,
  configureStore,
} from '@reduxjs/toolkit'
import loadingReducer from './reducers/loadingReducer'
import modalReducer from './reducers/modalReducer'
import snackbarReducer from './reducers/snackbarReducer'
import userReducer from './reducers/userReducer'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import trackingReducer from './reducers/trackingReducer'
import documentListReducer from './reducers/documentListReducer'
import smartFeatureReducer from './reducers/smartFeatureReducer'
import deviceConnectionReducer from './reducers/deviceConnectionReducer'

const reducer = combineReducers({
  loading: loadingReducer,
  userReducer,
  modal: modalReducer,
  snackbar: snackbarReducer,
  tracking: trackingReducer,
  documentList: documentListReducer,
  smartFeatureReducer: smartFeatureReducer,
  deviceConnectionReducer:deviceConnectionReducer
})
const store = configureStore({
  reducer
})
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export default store
