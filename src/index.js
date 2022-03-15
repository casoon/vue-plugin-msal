const plugin = {
    install (Vue) {
        Vue.PLUGIN_VERSION = "0.0.1";
        Vue.prototype.$toBold = function(text) {
            return `<b>${text}</b>`;
        };
    }
}

export default plugin