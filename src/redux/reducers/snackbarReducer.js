const initialState = {
    visible: false,
    text: '',
    isError: false
}

export default (state = initialState, action) => {
    const {payload, type} = action
    switch (type) {
        case 'SHOW_SNACKBAR':
            return {
                visible: true,
                text: payload.text,
                isError: payload.isError
            };
        case 'HIDE_SNACKBAR':
            return {
                visible: false,
                text: '',
                isError: false
            };
        default:
            return state;
    }
};