const initialState = {
  voiceToTextFeature: false,
  autoTranslateFeature: false,
}

interface Action {
  type: string;
  payload: any;
}

export default (state = initialState, action: Action) => {
  const { type, payload } = action
  switch (type) {
    case 'SET_VOICE_TO_TEXT_FEATURE':
      return {
        ...state,
        voiceToTextFeature: payload,
      };
    case 'SET_AUTO_TRANSLATE_FEATURE':
      return {
        ...state,
        autoTranslateFeature: payload,
      };
    default:
      return state;
  }
};