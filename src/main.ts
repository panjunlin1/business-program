import { createSSRApp } from 'vue';
import App from './App.vue';
import router from './router/index'; // 导入优化后的路由配置


export function createApp() {
    const app = createSSRApp(App);
    app.use(router);

    return {
        app,
        router
    };
}  