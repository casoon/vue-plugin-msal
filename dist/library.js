'use strict';

const plugin = {
    install(app, options) {
        const logout = () => {
            console.log("Logout is being called");
        };

        app.provide("logout", logout);
    }
};

module.exports = plugin;
