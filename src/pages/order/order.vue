<template>
  <div class="page-container">
    <div class="button">
      <button class="button-ton" @click="a1">全部</button>
      <button class="button-ton" @click="a2">已接取</button>
      <button class="button-ton" @click="a3">待接取</button>
      <button class="button-ton" @click="a4">已完成</button>
    </div>

    <!-- 未登录时跳转到登录页 -->
    <div v-if="!isLogin && !loading" class="login-tip" @click="navigateToLogin">
      请先登录查看订单
    </div>

    <!-- 加载中提示 -->
    <div v-if="loading" class="login-tip">加载中...</div>

    <!-- 已登录但无订单 -->
    <div v-if="isLogin && filteredOrder.length === 0 && !loading" class="login-tip">暂无订单数据</div>


    <!-- 订单列表 -->
    <div v-else-if="isLogin" class="order-list">
      <div v-for="order in filteredOrder" :key="order.id" class="order-card" @click="handleOrderClick(order.id,order.userid)">
        <div class="order-item">
          <div class="order-f1">
            <div class="data-pair">
              <span class="label">客户ID：</span>
              <span class="span">{{ order.userid}}</span>
            </div>
            <div class="data-pair">
              <span class="label">订单号：</span>
              <span class="span">{{ order.id }}</span>
            </div>
            <div class="data-pair">
              <span class="label">联系电话：</span>
              <span class="span">{{ userPhoneMap.get(order.userid) || '点击查看详情' }}</span>
            </div>
            <div class="data-pair">
              <span class="label">下单时间：</span>
              <span class="span time-text">{{ order.ordertime }}</span>
            </div>
          </div>
          <div class="order-f1">
            <div class="data-pair">
              <span class="label">状态：</span>
              <span class="span status-tag" :class="{
                'status-1': order.status === '1',
                'status-2': order.status === '2',
                'status-4': order.status === '4',
                'status-5': order.status === '5',
                'status-6': order.status === '6',
                'status-8': order.status === '8'
              }">
                {{ getStatusText(order.status) }}
              </span>
            </div>
            <div class="data-pair">
              <span class="label">用餐方式：</span>
              <span class="span">{{ order.diningChoice }}</span>
            </div>
            <div class="data-pair">
              <span class="label">支付方式：</span>
              <span class="span">{{ order.paymentmethod }}</span>
            </div>
            <div class="data-pair">
              <span class="label">总价：</span>
              <span class="span">{{ order.totalprice }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { baseUrl } from "@/router";
import {onShow, onLoad, onUnload} from '@dcloudio/uni-app';

// 响应式数据
const isLogin = ref(false); // 登录状态
const orders = ref([]); // 订单列表
const loading = ref(false); // 加载状态
const currentStatus = ref(''); // 当前筛选状态
const error = ref(''); // 错误信息
const userEntity = ref(null);
const userPhoneMap = ref(new Map()); // 用户电话


// 初始化：检查登录状态并加载订单
onMounted(async () => {
  // 检查登录状态（从本地存储获取）
  checkLoginStatus();

  // 如果已登录，加载订单
  if (isLogin.value) {
    await loadOrders();
  }
});


// 检查登录状态
// 订单页代码（修改部分）
const checkLoginStatus = () => {
  const loginstate = uni.getStorageSync('loginstate');
  const userEntity = uni.getStorageSync('userEntity');

  console.log('订单页登录状态检查：');
  console.log('loginstate:', loginstate);
  console.log('userEntity:', userEntity);

  // 从 userEntity 中获取 token
  const token = userEntity?.token || '';
  console.log('token:', token);

  // 判断登录状态
  isLogin.value = loginstate === "1" && !!userEntity && !!token;
  console.log('最终登录状态:', isLogin.value);
};

// 加载订单列表
const loadOrders = async () => {
  try {
    loading.value = true;
    const token = uni.getStorageSync('token');
    const res = await uni.request({
      url: `${baseUrl}/api/orders`,
      method: 'GET',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.data.code === 200 && res.data.data) {
      orders.value = res.data.data.map((order: any) => ({
        ...order,
        status: order.status + ''
      }));
      console.log('订单加载成功:', orders.value);
    } else {
      error.value = res.data.msg || '获取订单失败';
      console.error('订单接口返回错误:', res.data);
    }
  } catch (err) {
    error.value = '网络错误，无法加载订单';
    console.error('订单加载失败:', err);
  } finally {
    loading.value = false;
  }
};

// 页面加载时读取数据
onLoad(() => {
  try {
    const storedUserEntity = uni.getStorageSync('userEntity');
    if (storedUserEntity) {
      userEntity.value = storedUserEntity;
    }
  } catch (error) {
    console.error('读取 userEntity 数据失败:', error);
  }
});

onShow(() => {

  uni.$off('refreshOrderList');
  uni.$off('sendUserDataToOrder');

  // 页面显示时，监听刷新事件
  uni.$on('refreshOrderList', async () => {
    if (isLogin.value) {
      await loadOrders(); // 重新加载订单列表
    }
  });

  // 监听用户数据传递事件
  uni.$on('sendUserDataToOrder', (receivedData) => {
    console.log('接收的用户数据:', receivedData);
    // 存储“userid（即receivedData.id）-> userPhone”的映射
    if (receivedData.id && receivedData.userPhone) {
      userPhoneMap.value.set(receivedData.id, receivedData.userPhone);
      console.log('映射关系已更新:', userPhoneMap.value);
    }
  });

  // 读取本地数据（保留原有逻辑）
  try {
    const storedUserEntity = uni.getStorageSync('userEntity');
    if (storedUserEntity) {
      userEntity.value = storedUserEntity;
    }
  } catch (error) {
    console.error('读取数据失败:', error);
  }
});

// 页面卸载时移除监听，避免内存泄漏
onUnload(() => {
  uni.$off('refreshOrderList');
  uni.$off('sendUserDataToOrder');
});


// 订单状态文本映射
const statusMap = {
  '1': '已支付',
  '2': '已接取',
  '4': '待接取',
  '5': '已取消',
  '6': '已完成',
  '8': '商家已拒绝'
};


// 获取状态文本
const getStatusText = (status: string) => {
  return statusMap[status] || '未知状态';
};


// 筛选订单
const filteredOrder = computed(() => {
  // 先按状态筛选
  let result = orders.value;

  if (currentStatus.value) {
    if (currentStatus.value === '5,6,8') {
      result = result.filter(order => order.status === '5' || order.status === '6' || order.status === '8');
    } else {
      result = result.filter(order => order.status === currentStatus.value);
    }
  }
  // 再筛选出 id 的订单（核心新增逻辑）
  return result.filter(order => order.shopid === userEntity.value?.shop?.id);
});


// 筛选按钮事件
const a1 = () => { currentStatus.value = ''; }; // 全部
const a2 = () => { currentStatus.value = '2'; }; // 已接取
const a3 = () => { currentStatus.value = '1,4'; }; // 待接取
const a4 = () => { currentStatus.value = '5,6,8'; }; // 已完成


// 点击订单跳转详情
const handleOrderClick = (orderId: string, userId: string) => {
  if (!isLogin.value) return;
  console.log(orderId)
  console.log(userId);
  uni.navigateTo({
    url: `/pages/OrderDetails/OrderDetails?orderId=${encodeURIComponent(orderId)}&userId=${encodeURIComponent(userId)}`
  });
};

// 导航到登录页（补充缺失的函数）
const navigateToLogin = () => {
  uni.navigateTo({
    url: '/pages/login/login' // 假设登录页路径
  });
};
</script>


<style scoped>
/* 页面容器样式 */
.page-container {
  background-color: #f5f7fa; /* 页面背景色，与订单卡片形成对比 */
  min-height: 100vh;
  padding-bottom: 30rpx;
}

/* 状态框 */
.button {
  display: flex;
  background-color: #fff;
  padding: 20rpx;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}

.button-ton {
  font-size: 15px;
  color: #333;
  flex: 1;
  width: 100%; /* 占满整行，扩大点击范围 */
  text-align: center;
  position: relative;
  padding: 10rpx 0; /* 增加内边距，扩大点击区域 */
  margin: 0 5rpx; /* 按钮之间增加间距 */
  background: none;
  border: none;
}

/* 按钮点击反馈（小程序兼容） */
.button-ton:active {
  transform: scale(0.95);
  background-color: #f8f8f8;
  border-radius: 8rpx;
}

/* 订单列表容器 */
.order-list {
  padding: 0 20rpx;
}

/* 订单卡片容器：每个订单合并为一个独立卡片 */
.order-card {
  background-color: #ffffff; /* 白色背景与页面背景形成对比 */
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05); /* 明显的阴影增强立体感 */
  margin-bottom: 50rpx;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

/* 订单卡片点击效果 */
.order-card:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
}

/* 订单内容 */
.order-item {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 两列布局 */
  padding: 50rpx;
}

/* 左右分栏 */
.order-f1 {
  display: flex;
  flex-direction: column;
}

/* 数据项容器 */
.data-pair {
  display: flex;
  align-items: center;
  margin-bottom: 14rpx;
  padding: 10rpx;
}

/* 最后一个数据对去除底部间距 */
.data-pair:last-child {
  margin-bottom: 0;
}

/* 标签样式 */
.label {
  font-weight: bold;
  min-width: 120rpx; /* 固定标签宽度，确保对齐 */
  font-size: 24rpx;
  color: #555;
}

/* 内容样式 */
.span {
  font-weight: bold;
  font-size: 24rpx;
  color: #555;
  flex: 1;
  text-align: center; /* 内容靠右对齐 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 状态标签 */
.status-tag {
  padding: 6rpx 14rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  line-height: 1;
}

/* 状态色值 */
.status-1 {
  color: #FFA726;
  background-color: #FFF3E0;
}
.status-2 {
  color: #FFA726;
  background-color: #FFF3E0;
}
.status-4 {
  color: #42A5F5;
  background-color: #E3F2FD;
}
.status-5 {
  color: #757575;
  background-color: #EEEEEE;
}
.status-6 {
  color: #66BB6A;
  background-color: #E8F5E9;
}
.status-8 {
  color: #EF5350;
  background-color: #FFEBEE;
}

/* 时间文本 */
.time-text {
  color: #555;
  font-size: 22rpx;
  text-align: right;
}

/* 空状态提示 */
.login-tip {
  text-align: center;
  padding: 80rpx 20rpx;
  color: #999;
  font-size: 26rpx;
  margin-top: 40%;
}
</style>
    