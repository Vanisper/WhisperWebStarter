import { App } from 'vue';
import permission from './permission';

const directives = {
    install(Vue: App) {
        Vue.directive('permission', permission);
    },
};

export const setupDirective = (app: App) => {
    app.use(directives);
};

export default directives;