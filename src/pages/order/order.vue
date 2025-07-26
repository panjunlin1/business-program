// v-for="order in orders"是循环指令用来遍历orders数组，使用order.id作为唯一标识
// @click="handleOrderClick(order.id)：给框添加一个点击事件，并传递当前订单的ID
<template>
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
  <div v-else-if="isLogin" v-for="order in filteredOrder" :key="order.id" class="order-box" @click="handleOrderClick(order.id)">
    <div class="order-item">
      <div class="order-f1">
        <div class="data-pair">
          <span class="label">ID：</span>
          <span class="span">{{ order.shopid }}</span>
        </div>
        <div class="data-pair">
          <span class="label">订单号：</span>
          <span class="span">{{ order.id }}</span>
        </div>
        <div class="data-pair">
          <span class="label">联系电话：</span>
          <span class="span">{{ order.phoneNum }}</span>
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
            'status-2': order.status === '2',
            'status-4': order.status === '4',
            'status-5': order.status === '5',
            'status-6': order.status === '6'
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
</template>


<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { baseUrl } from "@/router";

// 响应式数据
const isLogin = ref(false); // 登录状态
const orders = ref([]); // 订单列表
const loading = ref(false); // 加载状态
const currentStatus = ref(''); // 当前筛选状态
const error = ref(''); // 错误信息


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

  // 从 userEntity 中获取 token（关键修改！）
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


// 订单状态文本映射
const statusMap = {
  '2': '已接取',
  '4': '待接取',
  '5': '已取消',
  '6': '已完成'
};

// 获取状态文本
const getStatusText = (status: string) => {
  return statusMap[status] || '未知状态';
};


// 筛选订单
const filteredOrder = computed(() => {
  if (!currentStatus.value) return orders.value;

  if (currentStatus.value === '5,6') {
    return orders.value.filter(order => order.status === '5' || order.status === '6');
  }

  return orders.value.filter(order => order.status === currentStatus.value);
});


// 筛选按钮事件
const a1 = () => { currentStatus.value = ''; }; // 全部
const a2 = () => { currentStatus.value = '2'; }; // 已接取
const a3 = () => { currentStatus.value = '4'; }; // 待接取
const a4 = () => { currentStatus.value = '5,6'; }; // 已完成


// 点击订单跳转详情
const handleOrderClick = (orderId: string) => {
  if (!isLogin.value) return;

  uni.navigateTo({
    url: `/pages/OrderDetails/OrderDetails?orderId=${orderId}`
  });
};


// 跳转到登录页
const navigateToLogin = () => {
  uni.navigateTo({
    url: '/pages/Login/Login' // 替换为你的登录页路径
  });
};
</script>


<style scoped>
/* 状态框 */
.button {
  display: flex;
  margin-bottom: 20rpx;
  background-color: #fff;
  padding: 20rpx;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
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
}

/* 订单框 */
.order-box {
  display: flex;
  flex-direction: row;
  height: 165px;
  border: 2px solid #000;
  margin: 10rpx 0; /* 按钮之间增加间距 */
}

/* 订单部分信息样式 */
.order-item {
  display: flex;
  font-size: 20px;
}

/* 信息排列方式 */
.order-f1 {
  width: 150px;
  height: 100%;
  padding: 30px;
  margin-bottom: 10px;
  font-size: 10px;
  display: flex;
  flex-direction: column;
}

/* 新增数据对容器样式 */
.data-pair {
  display: flex;
  align-items: flex-start; /* 顶部对齐 */
  margin-bottom: 5px;
  min-height: 24px; /* 确保每一行有最小高度 */
}

/* 新增标签样式 */
.label {
  font-weight: bold;
  color: #333;
  margin-right: 5px;
  min-width: 50px; /* 确保标签宽度一致，排版整齐 */
  padding-top: 2px; /* 微调标签位置 */
}

.time-text {
  white-space: normal;
  word-wrap: break-word;
  width: 100px; /* 按需调整，比如让时间在一定宽度内换行 */
}

/* 信息文本处理 */
.span {
  padding-top: 2px; /* 与标签对齐 */
  white-space: nowrap; /* 禁止文本换行 */
  overflow: hidden; /* 隐藏溢出部分 */
  text-overflow: ellipsis; /* 显示省略号 */
}

/* 状态标签特殊样式 */
.status-tag {
  font-weight: 600;
  padding: 2px 8px;
  width: 20%;
}

/* 已接取状态样式 */
.status-tag.status-2 {
  color: #ffb74d; /* 文字颜色 */
  background-color: #fff8e1; /* 浅黄色背景 */
}

/* 待接取状态样式 */
.status-tag.status-4 {
  color:  #ef5350; /* 文字颜色 */
  background-color: #ffebee; /* 浅红色背景 */
}

/* 已取消状态样式 */
.status-tag.status-5 {
  color:  #9e9e9e; /* 文字颜色 */
  background-color: #f5f5f5; /* 浅灰色背景 */
}

/* 已完成状态样式 */
.status-tag.status-6 {
  color: #4caf50; /* 文字颜色 */
  background-color: #f1f8e9; /* 浅绿色背景 */
}

/* 提示文本样式 */
.login-tip {
  text-align: center;
  padding: 50rpx;
  color: #666;
  font-size: 16px;
  /* 如果想让提示在垂直方向更靠下，可结合margin-top等调整：
  margin-top: auto; 会把提示推到容器底部 */
  margin-top: 60%;
}
</style>
