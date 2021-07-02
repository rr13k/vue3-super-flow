import SuperFlow from './index/index.vue';

const install = function (Vue) {
    // 全局注册组件
    Vue.component('BaseComp', SuperFlow);
}

export {
    install,
    SuperFlow
}
