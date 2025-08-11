const initialState = {
    show: false
}

export default (state = initialState, action) => {
    switch (action.type) {
        case 'SHOW_MODAL':
            return {
                show: true
            };
        case 'HIDE_MODAL':
            return {
                show: false
            };
        default:
            return state;
    }
};