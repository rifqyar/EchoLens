const initialState = {
    loading: false
}

export default (state = initialState, action) => {
    switch (action.type) {
        case 'LOADING_TRUE':
            return {
                loading: true
            };
        case 'LOADING_FALSE':
            return {
                loading: false
            };
        default:
            return state;
    }
};