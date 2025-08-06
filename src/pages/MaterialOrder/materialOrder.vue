<template>
  <view class="order-list-page">
    <!-- 顶部标签栏 -->
    <view class="tab-bar">
      <view
          v-for="(tab, index) in tabs"
          :key="index"
          class="tab-item"
          :class="{ active: currentTab === index }"
          @click="switchTab(index)"
      >
        {{ tab.name }}
      </view>
    </view>

    <!-- 订单列表 -->
    <view class="orders-container" v-if="!loading && !error && orderList.length > 0">
      <view
          class="order-card"
          v-for="(order, index) in filteredOrders"
          :key="order.shopid + '_' + order.id"
          @click="openOrderDetail(order)"
      >
        <!-- 订单头部信息 -->
        <view class="order-header">
          <view class="header-left">
            <text class="order-id">订单ID: {{ order.id }}</text>
            <text class="shop-id">{{ order.time }}</text>
            <text
                class="order-status"
                :style="{color: getStatusColor(order.status)}"
            >{{ getStatusText(order.status) }}</text>
          </view>
          <!-- 查看详情箭头 -->
          <image
              class="detail-icon"
              src="/static/icons/arrow_right.png"
          ></image>
        </view>

        <!-- 总价区域 -->
        <view class="order-total">
          <text class="total-label">总价:</text>
          <text class="total-amount">¥{{ order.totalprice }}</text>
        </view>

        <!-- 订单分隔线 -->
        <view class="order-divider" v-if="index !== filteredOrders.length - 1"></view>
      </view>
    </view>

    <!-- 加载、错误、空状态 -->
    <view class="loading-container" v-if="loading">加载中...</view>
    <view class="error-container" v-if="error">{{ errorMsg }}</view>
    <view class="empty-container" v-if="!loading && !error && orderList.length === 0">
      <text>暂无订单数据</text>
    </view>

    <!-- 订单详情浮层 (使用z-index展示) -->
    <view
        class="order-detail-modal"
        v-if="currentDetailOrder"
        :class="{ 'modal-visible': currentDetailOrder }"
        @touchmove.stop
    >
      <!-- 遮罩层 -->
      <view class="modal-mask" @click="closeOrderDetail"></view>

      <!-- 详情内容 -->
      <view class="modal-content">
        <!-- 顶部标题栏 -->
        <view class="modal-header">
          <text class="modal-title">订单详情</text>
          <image
              class="close-icon"
              src="/static/icons/close.png"
              @click="closeOrderDetail"
          ></image>
        </view>

        <!-- 订单基本信息 -->
        <view class="modal-body">
          <view class="detail-info">
            <text class="info-label">订单ID:</text>
            <text class="info-value">{{ currentDetailOrder.id }}</text>
          </view>

          <view class="detail-info">
            <text class="info-label">订单时间:</text>
            <text class="info-value">{{ currentDetailOrder.time }}</text>
          </view>

          <view class="detail-info">
            <text class="info-label">订单状态:</text>
            <text
                class="info-value"
                :style="{color: getStatusColor(currentDetailOrder.status)}"
            >{{ getStatusText(currentDetailOrder.status) }}</text>
          </view>

          <!-- 商品列表 -->
          <view class="materials-title">商品列表</view>
          <view class="materials-list">
            <view class="detail-item" v-for="(item, i) in currentDetailOrder.materialList" :key="i">
              <text class="item-name">{{ item.materialName }}</text>
              <view class="item-info">
                <text class="item-price">¥{{ item.materialPrice }}</text>
                <text class="item-quantity">x{{ item.quantity }}</text>
              </view>
            </view>
          </view>

          <!-- 总价 -->
          <view class="modal-total">
            <text class="total-text">总价:</text>
            <text class="total-value">¥{{ currentDetailOrder.totalprice }}</text>
          </view>

          <!-- 新增：状态操作按钮 -->
          <view class="action-buttons" v-if="currentDetailOrder.status === 1">
            <button class="btn accept-btn" @click="handleAccept">确认收货</button>
          </view>
          <view class="action-buttons" v-if="currentDetailOrder.status === 0">
            <button class="btn reject-btn" @click="handleReject">取消订单</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import {ref, onMounted, computed} from 'vue';
import { baseUrl } from '@/router';
// 状态管理
const orderList = ref([]);
const loading = ref(false);
const error = ref(false);
const errorMsg = ref('');
const currentDetailOrder = ref(null); // 当前打开的订单详情

// 标签逻辑
const tabs = ref([
  { name: '全部', status: null },
  { name: '配送中', status: 1 },
  { name: '已完成', status: [2, 3] }
]);
const currentTab = ref(0);

onMounted(() => {
  fetchOrders();
});

// 获取订单数据
const fetchOrders = async () => {
  loading.value = true;
  error.value = false;

  try {
    const shopidRes = await uni.getStorage({key: 'merchantId'});
    const shopid = shopidRes.data;

    console.log("shopid:", shopid);

    uni.request({
      url: `${baseUrl}/api/materialOrders/${shopid}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          if (res.data.code === 200 && res.data.data) {
            const rawOrders = res.data.data.map(order => ({
              ...order,
              materialList: parseMaterialJson(order.material)
            }));

            rawOrders.sort((a, b) => {
              // 假设 time 是 ISO 时间字符串，直接比较
              return new Date(b.time) - new Date(a.time);
            });

            orderList.value = rawOrders;

          } else {
            errorMsg.value = res.data.msg || '获取订单失败';
            error.value = true;
          }
        } else {
          errorMsg.value = `HTTP错误 ${res.statusCode}`;
          error.value = true;
        }
      },
      fail: (err) => {
        errorMsg.value = '网络请求失败，请检查网络连接';
        error.value = true;
        console.error('请求失败:', err);
      },
      complete: () => {
        loading.value = false;
      }
    });
  } catch (err) {
    errorMsg.value = '获取店铺ID失败';
    error.value = true;
    loading.value = false;
  }
};

// 解析material JSON字符串
const parseMaterialJson = (jsonStr) => {
  try {
    const materials = JSON.parse(jsonStr);
    return materials.map(item => {
      const filteredItem = {};
      Object.keys(item).forEach(key => {
        if (item[key] !== null) {
          filteredItem[key] = item[key];
        }
      });
      return filteredItem;
    });
  } catch (error) {
    console.error('解析商品数据失败:', error);
    return [];
  }
};

// 订单状态处理
const getStatusText = (status) => {
  const statusMap = {
    0: '待发货',
    1: '已发货',
    2: '已完成',
    3: '已取消'
  };
  return statusMap[status] || '未知状态';
};

const getStatusColor = (status) => {
  const colorMap = {
    0: '#FF6600',
    1: '#007AFF',
    2: '#34C759',
    3: '#8E8E93'
  };
  return colorMap[status] || '#333';
};

// 切换标签
const switchTab = (index) => {
  currentTab.value = index;
};

// 筛选订单
const filteredOrders = computed(() => {
  const activeTab = tabs.value[currentTab.value];
  if (activeTab.status === null) {
    return orderList.value;
  }else if (Array.isArray(activeTab.status)) {
    // 多状态标签（如[2,3]）：订单状态在数组中则保留
    return orderList.value.filter(order =>
        activeTab.status.includes(order.status)
    );
  } else {
    // 单状态标签（如1）：精确匹配
    return orderList.value.filter(order =>
        order.status === activeTab.status
    );
  }
});

// 订单详情相关方法
const openOrderDetail = (order) => {
  currentDetailOrder.value = order; // 打开订单详情
};

const closeOrderDetail = () => {
  currentDetailOrder.value = null; // 关闭订单详情
};

// 新增：定义修改订单状态的接口
const updateOrderStatus = (orderId, newStatus) => {
  console.log("orderId:"+orderId);
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${baseUrl}/api/materialOrders/${orderId}/status`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
         'token': uni.getStorageSync('token') // 添加认证token
      },
      data: { status: newStatus,
      id: orderId
      }, // 传递状态参数
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          resolve(res.data);
        } else {
          reject(new Error(res.data.msg || `状态码错误: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(new Error('请求失败: ' + err.errMsg));
      }
    });
  });
};


// 新增：接受订单逻辑
const handleAccept = async () => {
  try {
    await updateOrderStatus(currentDetailOrder.value.id, 2); // 调用接口修改状态为“已接取”
    currentDetailOrder.value.status = 2; // 本地更新状态（无需重新请求接口）
    await uni.showToast({title: '订单已接受', icon: 'success'});
    // 返回列表页并触发刷新
    setTimeout(() => {
      uni.navigateBack({
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
    await updateOrderStatus(currentDetailOrder.value.id, 3); // 调用接口修改状态为“已取消”
    currentDetailOrder.value.status = 3; // 本地更新状态
    await uni.showToast({title: '订单已拒绝', icon: 'none'});
    uni.navigateBack({
      success: () => {
        uni.$emit('refreshOrderList');
      }
    });
  } catch (err) {
    await uni.showToast({title: '操作失败：' + err.message, icon: 'none'});
  }
};
</script>

<style scoped>
/* 标签栏样式 */
.tab-bar {
  display: flex;
  background-color: #FFFFFF;
  border-bottom: 1rpx solid #ECECEC;
}
.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #333;
}
.tab-item.active {
  color: #007AFF;
  border-bottom: 4rpx solid #007AFF;
}

/* 订单列表样式 */
.orders-container {
  padding: 50rpx 10px 30px;
}

.order-card {
  height: 105px;
  margin-bottom: 30rpx;
  border: 1rpx solid #ECECEC;
  border-radius: 8rpx;
  background-color: #FFFFFF;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 20rpx;
  border-bottom: 1rpx solid #F5F5F5;
}

.header-left {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 90rpx;
}

.order-id {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.shop-id {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.order-status {
  position: absolute;
  right: 20px; /* 靠右对齐 */
  font-size: 26rpx;
}

.detail-icon {
  width: 32rpx;
  height: 32rpx;
}

.order-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1rpx solid #F5F5F5;
}

.total-label {
  font-size: 28rpx;
  color: #666;
}

.total-amount {
  font-size: 30rpx;
  color: #E60012;
  font-weight: bold;
}

.order-divider {
  height: 40rpx;
  background-color: #FAFAFA;
  border-top: 1rpx solid #ECECEC;
}

/* 状态容器样式 */
.loading-container,
.error-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 500rpx;
  font-size: 30rpx;
  color: #666;
}

.error-container {
  color: #E60012;
}

/* 订单详情浮层样式 (核心z-index实现) */
.order-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999; /* 确保在最上层 */
  padding-top: 45%;
  padding-left: 10%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  /* 让浮层区域的滚动事件不穿透 */
  touch-action: none;
  /* 覆盖整个视口，加强固定效果 */
  background-color: transparent;
}

.order-detail-modal.modal-visible {
  display: block;
}

/* 遮罩层 */
.modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1;
  /* 让遮罩层拦截触摸滚动事件 */
  touch-action: none;
}

/* 内容容器 */
.modal-content {
  position: relative;
  width: 80%; /* 可根据需求调整宽度 */
  background-color: #FFFFFF;
  border-radius: 20rpx;
  z-index: 2; /* 确保内容在遮罩层上方 */
  max-height: 80vh;
  overflow-y: auto;
  will-change: transform;
  /* 允许内部内容滚动 */
  touch-action: auto;
}

/* 头部标题 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #F5F5F5;
}

.modal-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.close-icon {
  width: 40rpx;
  height: 40rpx;
}

/* 身体内容 */
.modal-body {
  padding: 30rpx;
}

.detail-info {
  display: flex;
  margin-bottom: 30rpx;
}

.info-label {
  font-size: 28rpx;
  color: #666;
  width: 200rpx;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  flex: 1;
}

.materials-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin: 20rpx 0;
  padding-bottom: 10rpx;
  border-bottom: 1rpx solid #F5F5F5;
}

.materials-list {
  margin-bottom: 30rpx;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #F8F8F8;
}

.item-name {
  font-size: 28rpx;
  color: #333;
}

.item-info {
  display: flex;
  align-items: center;
}

.item-price {
  font-size: 28rpx;
  color: #E60012;
  margin-right: 20rpx;
}

.item-quantity {
  font-size: 28rpx;
  color: #666;
}

/* 总价 */
.modal-total {
  display: flex;
  justify-content: flex-end;
  padding: 20rpx 0;
  margin-top: 20rpx;
  border-top: 2rpx solid #F5F5F5;
}

.total-text {
  font-size: 30rpx;
  color: #666;
  margin-right: 10rpx;
}

.total-value {
  font-size: 32rpx;
  color: #E60012;
  font-weight: bold;
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