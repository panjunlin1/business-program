import { createSSRApp } from 'vue';
import App from './App.vue';
import router from './router/index'; // 导入优化后的路由配置

// 创建请求拦截器
const installInterceptor = () => {
  // 定义不需要token的完整URL路径
  const noAuthUrls = [
    '/shop/getopenid',
    '/shop/getphone',
    '/shop/login'
  ];
  
  // 请求拦截器
  uni.addInterceptor('request', {
    invoke(options) {
      // 检查是否需要添加token（只有不在排除列表中的接口才添加token）
      const requiresAuth = !noAuthUrls.some(url => options.url?.includes(url));
      
      console.log('请求URL:', options.url);
      console.log('是否需要认证:', requiresAuth);
      
      // 如果需要认证，则添加token
      if (requiresAuth) {
        const token = uni.getStorageSync('token');
        console.log('从storage获取的token:', token); // 添加调试信息
        
        if (token) {
          if (!options.header) {
            options.header = {};
          }
          // 使用token作为header的key，而不是Authorization
          options.header['token'] = token;
          console.log('添加的Token:', options.header['token']);
        } else {
          console.warn('需要认证但未找到token:', options.url);
        }
      }
      
      // 设置默认Content-Type
      if (!options.header) {
        options.header = {};
      }
      if (!options.header['Content-Type']) {
        options.header['Content-Type'] = 'application/json';
      }
      
      return options;
    },
    
    success(response) {
      console.log('响应成功:', response);
      return response;
    },
    
    fail(error) {
      console.error('请求失败:', error);
      return error;
    }
  });
};

export function createApp() {
    const app = createSSRApp(App);
    app.use(router);
    
    // 安装拦截器
    installInterceptor();

    return {
        app,
        router
    };
}
