import { reactive } from 'vue';
import Cookies from 'js-cookie';

const state = reactive({
    login: Cookies.get('loggedIn'),
    error: null,
    accessToken: null
});


const methods = {
    async login({ commit }) {
        try {
            commit('loginBegin');
            Cookies.set('loggedIn', true);
            return commit('loginSuccess', true);
        } catch (err) {
            commit('loginErr', err);
        }
    },
    async logOut({ commit }) {
        try {
            commit('logoutBegin');
            Cookies.remove('loggedIn');
            commit('logoutSuccess', null);
        } catch (err) {
            commit('logoutErr', err);
        }
    },
};

export default {
    state,
    methods,
};
