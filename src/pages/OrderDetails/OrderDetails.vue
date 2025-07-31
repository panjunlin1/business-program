<template>
  <div class="order-detail-container">
    <!-- 标题区域 -->
    <div class="order-item">
      <div class="order-f1">
        <div class="data-pair">
          <span class="label">客户ID：</span>
          <span class="span">{{ order.userid }}</span>
        </div>
        <div class="data-pair">
          <span class="label">订单号：</span>
          <span class="span">{{ order.id }}</span>
        </div>
        <div class="data-pair">
          <span class="label">联系电话：</span>
          <span class="span">{{ userData.userPhone }}</span>
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
          'status-6': order.status === '6',
          'status-8': order.status === '8'}">
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

    <!-- 新增：状态操作按钮 -->
    <div class="action-buttons" v-if="order.status === '4'">
      <button class="btn accept-btn" @click="handleAccept">接受订单</button>
      <button class="btn reject-btn" @click="handleReject">拒绝订单</button>
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

// 3. 定义获取订单详情列表的方法
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
        ? data2.find(item => item.id.toString() === orderId)
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
    if (userData.value) { // 确保 userData 已加载
      handleUpdateUserInfo();
    }
  }
});

const statusMap = {
  '2': '已接取',
  '4': '待接取',
  '5': '已取消',
  '6': '已完成',
  '8': '商家已拒绝'
}

const getStatusText = (status) => {
  return statusMap[status] || '状态未知';
}

// 新增：定义修改订单状态的接口
const updateOrderStatus = (orderId, newStatus) => {
  return request(`${baseUrl}/api/orders/${orderId}/status`, 'POST', {
    status: newStatus
  });
};

// 新增：接受订单逻辑
const handleAccept = async () => {
  try {
    await updateOrderStatus(order.value.id, '2'); // 调用接口修改状态为“已接取”
    order.value.status = '2'; // 本地更新状态（无需重新请求接口）
    await uni.showToast({title: '订单已接受', icon: 'success'});
    // 返回列表页并触发刷新
    setTimeout(() => {
      uni.navigateBack({
        delta: 1, // 返回上一页（订单列表页）
        success: () => {
          // 通过事件通知列表页刷新
          uni.$emit('refreshOrderList');
        }
      });
    }, 500);
  } catch (err) {
    await uni.showToast({title: '操作失败：' + err.message, icon: 'none'});
  }
};

// 新增：拒绝订单逻辑
const handleReject = async () => {
  try {
    await updateOrderStatus(order.value.id, '8'); // 调用接口修改状态为“已取消”
    order.value.status = '5'; // 本地更新状态
    await uni.showToast({title: '订单已拒绝', icon: 'none'});
    uni.navigateBack({
      delta: 1,
      success: () => {
        uni.$emit('refreshOrderList');
      }
    });
  } catch (err) {
    await uni.showToast({title: '操作失败：' + err.message, icon: 'none'});
  }
};

// 假设在某个操作后需要传递 userData 回列表页
const handleUpdateUserInfo = () => {
  // 1. 假设 userData 已更新（例如：userData.value.userPhone = '139x'）
  console.log('准备传递的 userData:', userData.value);

  // 2. 触发事件，传递数据
  uni.$emit('sendUserDataToOrder', userData.value);
};

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

/* 已接取状态样式 */
.status-tag.status-2 {
  color: #ffb74d; /* 文字颜色 */
  background-color: #fff8e1; /* 浅黄色背景 */
}

/* 价格标签特殊样式 */
.status-tag.status-4 {
  color:  #ef5350; /* 文字颜色 */
  background-color: #ffebee; /* 浅红色背景 */
}

/* 已取消状态样式 */
.status-tag.status-5 {
  color:  #9e9e9e; /* 文字颜色 */
  background-color: #f5f5f5; /* 浅灰色背景 */
}

/* 状态标签特殊样式 */
.status-tag.status-6 {
  color: #4caf50; /* 文字颜色 */
  background-color: #f1f8e9; /* 浅绿色背景 */
}

.status-tag.status-8 {
  color:  #ef5350; /* 文字颜色 */
  background-color: #ffebee; /* 浅红色背景 */
}


/* 用户信息区域样式 */
.user-info {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 10px;
}

/* 新增按钮样式 */
.action-buttons {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
  padding: 0 20px;
}

.btn {
  width: 45%;
  height: 40px;
  line-height: 40px;
  text-align: center;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  border: none;
}

.accept-btn {
  background-color: #4caf50; /* 绿色 */
}

.reject-btn {
  background-color: #f44336; /* 红色 */
}
</style>