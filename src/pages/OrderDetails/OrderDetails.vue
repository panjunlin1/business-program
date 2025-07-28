<template>
  <div class="order-detail-container">
    <!-- 标题区域 -->
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
          <span class="span">{{ order.paymentmethod }}</span>
        </div>
        <div class="data-pair">
          <span class="label">总价：</span>
          <span class="span totalPrice-tag">{{ order.totalprice }}￥</span>
        </div>
      </div>
    </div>

    <!-- 商品列表区域 -->
    <div class="product-list">
<!--      <p class="product-list-title">用户选择的所有商品：从上往下一一列举，包含菜品名称、价格、数量</p>-->
      <div
          class="product-item"
          v-for="(product, index) in userDetails.items"
          :key="index">
        <span>{{ product.dishName }}</span>
        <span>*{{ product.quantity }}</span>
        <span>{{ (product.unitPrice)*(product.quantity) }}￥</span>
      </div>
    </div>

    <!-- 用户信息区域 -->
    <div class="user-info">
      <div class="order-info-item">
        <span class="info-label">用户名称：</span>
        <span class="info-value">{{ userData.userName }}</span>
      </div>
      <div class="order-info-item">
        <span class="info-label">联系电话：</span>
        <span class="info-value">{{ userData.userPhone }}</span>
      </div>
      <div class="order-info-item">
        <span class="info-label">收货地址：</span>
        <span class="info-value">{{ userData.userAddress }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref} from 'vue';
import { onLoad } from "@dcloudio/uni-app";
import {baseUrl} from "@/router";

const order = ref({});
const userData = ref({});
const userDetails = ref({});
// 加载状态
const loading = ref(false);
// 错误信息
const error = ref('');

const request = (url, method = 'GET', data = {}) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      data,
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.data.code === 200) {
          resolve(res.data.data); // 只返回数据部分
          console.log("aaaaa:",res.data.data);
        } else {
          reject(new Error(res.data.msg || '请求失败'));
        }
      },
      fail: (err) => reject(new Error('网络请求失败：' + err.errMsg))
    });
  });
};

// 2. 定义获取订单列表的方法
const getOrderById = (orderId) => {
  // 接口路径调整为获取列表（假设后端列表接口为 /api/orders）
  return request(`${baseUrl}/api/orders/${orderId}`);
};

// 2. 定义获取用户列表的方法
const getOrderUserById = (userId) => {
  // 接口路径调整为获取列表（假设后端列表接口为 /api/orders）
  return request(`${baseUrl}/api/orders/user/${userId}`);
};

// 2. 定义获取用户列表的方法
const getOrderUserDetailsById = (userId) => {
  // 接口路径调整为获取列表（假设后端列表接口为 /api/orders）
  return request(`${baseUrl}/api/orders/user/${userId}/details`);
};

onLoad(async (options) => {
  const { orderId, userId } = options; // 同时获取两个参数
  console.log('订单ID:', orderId);
  console.log('用户ID:', userId);

  if (!orderId) {
    error.value = '订单ID不存在';
    return;
  }

  try {
    loading.value = true;
    const data = await getOrderById(orderId); // data是数组：[{id:1, ...}]
    const data1 = await getOrderUserById(userId);
    const data2 = await getOrderUserDetailsById(userId);
    console.log("data2:",data2)
    // 兼容数组格式：取第一个元素
    const orderData = Array.isArray(data) ? data[0] : data;
    console.log("orderData:",orderData);
    userData.value = Array.isArray(data1) ? data1[0] : data1;
    console.log("userData:",userData);

    userDetails.value = Array.isArray(data2)
        ? data2.find(item => item.id.toString() === orderId)  // 注意类型转换（接口返回可能是数字，orderId是字符串）
        : data2;

    console.log("userDetails:",userDetails);
    // 处理状态（确保orderData存在）
    order.value = {
      ...orderData,
      status: orderData ? (orderData.status + '') : '' // 避免orderData为undefined
    };
    console.log("数据：",data);
    console.log('修正后的数据：', order.value); // 此时应显示正确的订单对象
    console.log("用户信息：",userData);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});


// onLoad((options) => {
//   const orderId = options.orderId;
//   console.log('详情页接收的orderId:', orderId);
//
//   // // 模拟异步获取完整订单数据
//   // setTimeout(() => {
//   //   order.value = {
//   //     id: orderId,
//   //     status: '4',
//   //     orderId: 'ORD004',
//   //     diningChoice: '堂食',
//   //     orderTime: '2023-10-01 12:00:00',
//   //     totalPrice: '106.00',
//   //     // 商品列表数据
//   //     products: [
//   //       { name: '牛蛙火锅', quantity: 1, price: 100 },
//   //       { name: '青菜', quantity: 1, price: 2 },
//   //       { name: '火腿肠', quantity: 2, price: 4 }
//   //     ],
//   //     // 用户信息
//   //     userName: '张三',
//   //     phone: '13800138000',
//   //     address: 'XX市XX区XX街道123号',
//   //     paymentMethod: '微信支付'
//   //   };
//   // }, 1000);
// });

const statusMap = {
  '2': '已接取',
  '4': '待接取',
  '5': '已取消',
  '6': '已完成'
}

const getStatusText = (status) => {
  return statusMap[status] || '状态未知';
}


</script>

<style scoped>
/* 页面容器样式 */
.order-detail-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  min-height: 100vh;
  box-sizing: border-box;
}

/* 订单部分信息样式 */
.order-item {
  display: flex;
  font-size: 20px;
}

/* 信息排列方式 */
.order-f1 {
  width: 140px;
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


/* 信息文本处理 */
.span {
  padding-top: 2px; /* 与标签对齐 */
  white-space: nowrap; /* 禁止文本换行 */
  overflow: hidden; /* 隐藏溢出部分 */
  text-overflow: ellipsis; /* 显示省略号 */
}

/* 信息项通用样式 */
.order-info-item {
  display: flex;
  padding: 10px 0;
  align-items: center;
  flex-wrap: wrap;
}

/* 标签通用样式 */
.info-label {
  color: #666;
  font-size: 16px;
  font-weight: 500;
  width: 120px; /* 固定标签宽度 */
  text-align: right;
  margin-right: 10px;
}

.time-text {
  white-space: normal;
  word-wrap: break-word;
  width: 100px; /* 按需调整，比如让时间在一定宽度内换行 */
}

/* 值通用样式 */
.info-value {
  color: #333;
  font-size: 16px;
}

/* 商品列表样式 */
.product-list {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 20px;
}

.product-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
}

/* 状态标签特殊样式 */
.status-tag.status-6 {
  color: #4caf50;
  font-weight: 600;
  background-color: #f1f8e9;
  border-radius: 4px;
}

/* 价格标签特殊样式 */
.status-tag.status-4 {
  color: #f44336;
  font-weight: 600;
  font-size: 10px;
}

/* 用户信息区域样式 */
.user-info {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 10px;
}
</style>