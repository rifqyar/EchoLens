// redux/actions/countAction.js
export const setVoiceToTextEnabled = () => {
  return {
    type: 'SET_VOICE_TO_TEXT_FEATURE',
    payload: true
  };
};

export const setVoiceToTextDisabled = () => {
  return {
    type: 'SET_VOICE_TO_TEXT_FEATURE',
    payload: false
  };
};

export const setAutoTranslationEnabled = () => {
  return {
    type: 'SET_AUTO_TRANSLATE_FEATURE',
    payload: true
  };
};

export const setAutoTranslationDisabled = () => {
  return {
    type: 'SET_AUTO_TRANSLATE_FEATURE',
    payload: false
  };
};