import {createMemoryHistory, createRouter} from 'vue-router';
import OrderDetails from '@/pages/OrderDetails/OrderDetails.vue';
import OrderList from '../pages/order/order.vue'; // 假设订单列表组件路径

// 定义 API 基础 URL

const baseUrl = 'https://11kx146lc0484.vicp.fun'; // 姚兆宏的域名
// const baseUrl = 'https://qb111pq526416.vicp.fun';  // 古圣民的域名
// const baseUrl = 'https://pjl.juntaitec.cn';
const routes = [
    {
        path: '/',
        redirect: '/orders' // 默认重定向到订单列表页
    },
    {
        path: '/orders',
        name: 'OrderList',
        component: OrderList
    },
    {
        path: '/order/detail/:orderId',
        name: 'OrderDetails',
        component: OrderDetails,
        props: true // 允许将路由参数作为组件props传递
    }
];

// 根据环境选择历史模式
const router = createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createMemoryHistory(),
    routes
});

// main.ts 或 router/index.ts
router.beforeEach((to, from, next) => {
    console.log('导航守卫 - 开始:', from.path, '->', to.path);

    // 添加条件判断（如果需要）
    if (to.name === 'OrderDetails') {
        console.log('即将跳转到订单详情页');
    }

    next(); // 确保放行所有导航
});

router.afterEach((to, from) => {
    console.log('导航守卫 - 完成:', from.path, '->', to.path);
});

export {baseUrl};

export default router;