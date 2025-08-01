<template>
  <div class="order-detail-container">
    <!-- 标题区域（红框部分，新增统一容器样式） -->
    <div class="info-card">
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
            <span class="label">总价：</span>
            <span class="span totalPrice-tag">{{ order.totalprice }}￥</span>
          </div>
        </div>
        <div class="order-f1">
          <div class="data-pair">
            <span class="label">支付方式：</span>
            <span class="span">{{ order.paymentmethod }}</span>
          </div>
          <div class="data-pair">
            <span class="label">用餐方式：</span>
            <span class="span">{{ order.diningChoice }}</span>
          </div>
        </div>
        <div class="order-f1">
          <div class="data-pair">
            <span class="label">联系电话：</span>
            <span class="span">{{ userData.userPhone }}</span>
          </div>
          <div class="data-pair">
            <span class="label">下单时间：</span>
            <span class="span time-text">{{ order.ordertime }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 商品列表区域（已有样式，保持结构） -->
    <div class="product-list">
      <div
          class="product-item"
          v-for="(product, index) in userDetails.items"
          :key="index">
        <span>{{ product.dishName }}</span>
        <span>*{{ product.quantity }}</span>
        <span>{{ (product.unitPrice)*(product.quantity) }}￥</span>
      </div>
    </div>

    <!-- 用户信息区域（已有样式，保持结构） -->
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
        console.log('请求成功，响应数据:', res);
        if (res.data.code === 200) {
          resolve(res.data.data); // 只返回数据部分
          console.log("aaaaa:",res.data.data);
        } else {
          reject(new Error(res.data.msg || '请求失败'));
        }
      },
      fail: (err) => {
        console.error('网络请求失败:', err);
        reject(new Error('网络请求失败：' + err.errMsg));
      }
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

// 新增：打印订单接口
const printOrder = (orderId) => {
  const printUrl = `${baseUrl}/api/orders/${orderId}/print`;

  return new Promise((resolve, reject) => {
    wx.request({
      url: printUrl,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': uni.getStorageSync('token') // 添加认证信息
      },
      success: (res) => {
        console.log('打印接口请求成功，响应:', res);
        // 即使状态码不是200，也可能需要处理
        if (res.statusCode === 200) {
          if (res.data.code === 200) {
            resolve(res.data.data);
          } else {
            reject(new Error(res.data.msg || '打印失败: ' + JSON.stringify(res.data)));
          }
        } else {
          reject(new Error(`打印接口HTTP错误: ${res.statusCode}, 响应: ${JSON.stringify(res)}`));
        }
      },
      fail: (err) => {
        console.error('打印接口请求失败:', err);
        reject(new Error('打印请求失败: ' + err.errMsg));
      }
    });
  });
};

// 新增：接受订单逻辑
const handleAccept = async () => {
  try {
    // 先调用接受订单接口
    await updateOrderStatus(order.value.id, '2'); // 调用接口修改状态为"已接取"
    order.value.status = '2'; // 本地更新状态（无需重新请求接口）

    // 然后调用打印接口
    try {
      await printOrder(order.value.id);
      await uni.showToast({title: '订单已接受并发送打印', icon: 'success'});
    } catch (printErr) {
      console.error('打印请求失败:', printErr);
      // 即使打印失败，也不影响接受订单的操作
      await uni.showToast({title: '订单已接受，打印失败', icon: 'none'});
    }

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

/* 新增通用卡片样式，让红框、商品列表、用户信息区域样式统一 */
.info-card,
.product-list,
.user-info {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 10px;
  margin-bottom: 20px;
}

/* 订单部分信息样式 */
.order-item {
  display: block;
  font-size: 20px;

}

.order-f1 {
  width: 100%;
  height: 100%;
  padding-top: 20px;
  padding-left: 10px;
  left: 0;
  margin-bottom: 10px;

}

.data-pair {
  display: table;         /* 模拟表格 */
  width: 100%;            /* 占满父容器 */
  margin-bottom: 12px;
  min-height: 25px;
  font-size: 15px;
}

.label, .span {
  display: table-cell;    /* 模拟单元格 */
}

.label {
  width: 80px;
  text-align: left;
  font-weight: bold;
}

.span {
  text-align: center;
}

.order-info-item {
  display: flex;
  padding: 10px 0;
  align-items: center;
  flex-wrap: wrap;
}

.info-label {
  color: #666;
  font-size: 16px;
  font-weight: 500;
  width: 120px;
  text-align: right;
  margin-right: 10px;
}

.time-text {
  text-align: center;
  white-space: normal;
  word-wrap: break-word;

}

.info-value {
  color: #333;
  font-size: 16px;
}

.product-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
}

.status-tag.status-2 {
  color: #ffb74d;
  background-color: #fff8e1;
}

.status-tag.status-4 {
  color:  #ef5350;
  background-color: #ffebee;
}

.status-tag.status-5 {
  color:  #9e9e9e;
  background-color: #f5f5f5;
}

.status-tag.status-6 {
  color: #4caf50;
  background-color: #f1f8e9;
}

.status-tag.status-8 {
  color:  #ef5350;
  background-color: #ffebee;
}

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
  background-color: #4caf50;
}

.reject-btn {
  background-color: #f44336;
}
</style>