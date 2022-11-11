import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import './plugins/element.js'
import 'element-ui/lib/theme-chalk/index.css';

import {request} from './network/request';

Vue.prototype.$request = request;

// 导入全局css
import 'assets/css/base.css'

import {Loading,Checkbox} from 'element-ui';

Vue.config.productionTip = false


Vue.use(Loading.directive);
Vue.use(Checkbox);

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app')
