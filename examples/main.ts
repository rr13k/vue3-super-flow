
import { createApp } from 'vue'
import './index.less'
import SuperFlow from  '../packages/index/index.vue'

import plus from './plus/plus.vue'
import demo from './App.vue'

var App

if(import.meta.env.MODE =='plus'){
  App = plus
}else{
  App = demo
}

createApp(App)
.use(SuperFlow,{})
.mount('#app')
