import { defineStore } from "pinia";
import Cookies from 'js-cookie';

export const useAuth = defineStore({
    id: 'vue-plugin-msal',
    state: () => ({
        login: Cookies.get('loggedIn'),
        error: null,
        accessToken: null
    }),
    actions: {

    }
})