// v-for="order in orders"是循环指令用来遍历orders数组，使用order.id作为唯一标识
// @click="handleOrderClick(order.id)：给框添加一个点击事件，并传递当前订单的ID
<template>
  <div class="button">
    <button class="button-ton" @click="a1">全部</button>
    <button class="button-ton" @click="a2">已接取</button>
    <button class="button-ton" @click="a3">待接取</button>
    <button class="button-ton" @click="a4">已完成</button>
  </div>

  <div v-for="order in filteredOrder" :key="order.id" class="order-box" @click="handleOrderClick(order.id)">
    <div class="order-item">
      <div class="order-f1">
        <div class="data-pair">
          <span class="label">ID：</span>
          <span class="span">{{ order.id }}</span>
        </div>
        <div class="data-pair">
          <span class="label">订单号：</span>
          <span class="span">{{ order.orderId }}</span>
        </div>
        <div class="data-pair">
          <span class="label">联系电话：</span>
          <span class="span">{{ order.phone }}</span>
        </div>
        <div class="data-pair">
          <span class="label">下单时间：</span>
          <span class="span time-text">{{ order.orderTime }}</span>
        </div>
      </div>
      <div class="order-f1">
        <div class="data-pair">
          <span class="label">状态：</span>
          <span class="span status-tag" :class="{
          'status-2': order.status === '2',
          'status-4': order.status === '4',
          'status-5': order.status === '5',
          'status-6': order.status === '6'}">
            {{ getStatusText(order.status) }}
          </span>
        </div>
        <div class="data-pair">
          <span class="label">用餐方式：</span>
          <span class="span">{{ order.diningChoice }}</span>
        </div>
        <div class="data-pair">
          <span class="label">支付方式：</span>
          <span class="span">{{ order.paymentMethod }}</span>
        </div>
        <div class="data-pair">
          <span class="label">总价：</span>
          <span class="span">{{ order.totalPrice }}</span>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import {computed, ref} from 'vue';

// 模拟订单数据数组，实际应用中从后端接口获取
const orders = ref([
  {
    id: '897894261',
    status: '6',
    orderId: '#12366',
    diningChoice: '外卖',
    orderTime: '2025-10-11 20:00:00',
    totalPrice: '100.00￥',
    phone: '147258369',
    paymentMethod: '支付宝'
  },
  {
    id: '123456554',
    status: '2',
    orderId: 'ORD002',
    diningChoice: '堂食',
    orderTime: '2023-10-01 12:00:00',
    totalPrice: '50.00￥',
    phone: '123456789',
    paymentMethod: '微信'
  },
  {
    id: '564641589',
    status: '4',
    orderId: 'ORD003',
    diningChoice: '自提',
    orderTime: '2023-10-01 12:00:00',
    totalPrice: '70.00￥',
    phone: '963852741',
    paymentMethod: '微信'
  },
  {
    id: '4516158',
    status: '5',
    orderId: 'ORD004',
    diningChoice: '自提',
    orderTime: '2023-10-01 12:00:00',
    totalPrice: '55.00￥',
    phone: '651694815',
    paymentMethod: '支付宝'
  }
]);

// 接收通过事件绑定从DOM元素传递来的orderId参数
// 使用APP框架的导航API（uni-app为例）
// 路由跳转（uni-app框架）使用uni.navigateTo方法跳转到订单详情页（uni-app框架提供的导航）
// 目标路径格式：/pages/abc/abc?orderId=${orderId}
// 其中/pages/abc/abc是页面路径，需要在pages.json设置；?orderId=${orderId}为URL参数，用于传递订单ID到详情页
const handleOrderClick = (orderId) => {
  console.log('点击事件触发，orderId:', orderId)
  uni.navigateTo({
    url: `/pages/OrderDetails/OrderDetails?orderId=${orderId}`, // 对应pages.json中的页面路径
  }).catch(err => {
    console.error('路由跳转错误:', err); // 捕获并打印可能的错误
  });
}

const statusMap = {
  '2': '已接取',
  '4': '待接取',
  '5': '已取消',
  '6': '已完成'
}

// 计算筛选后的订单
const filteredOrder = computed(() => {
  if(!currentStatus.value) return orders.value;

  // 处理筛选5和6的情况
  if (currentStatus.value === '5,6') {
    return orders.value.filter(order => order.status === '5' || order.status === '6');
  }

  return orders.value.filter(order => order.status === currentStatus.value);
});

const getStatusText = (status) => {
  return statusMap[status] || '状态未知';
}

//
// 使用 Vue 3 的 Composition API 定义方法
const currentStatus = ref('');
const a1 = () => {
  console.log('点击了"全部"按钮');
  currentStatus.value = '';
};

const a2 = () => {
  console.log('点击了"已接取"按钮');
  currentStatus.value = '2';
};

const a3 = () => {
  console.log('点击了"待接取"按钮');
  currentStatus.value = '4';
};

const a4 = () => {
  console.log('点击了"已完成"按钮');
  currentStatus.value = '5,6';
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

</style>