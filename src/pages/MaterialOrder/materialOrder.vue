<template>
  <view class="order-list-page">
    <!-- 新增顶部标签栏 -->
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
      >
        <!-- 点击展开区域 -->
        <view class="order-header" @click="toggleOrderDetail(order.id)">
          <view class="header-left">
            <text class="order-id">订单ID: {{ order.id }}</text>
            <text class="shop-id">商家ID: {{ order.shopid }}</text>
            <text
                class="order-status"
                :style="{color: getStatusColor(order.status)}"
            >{{ getStatusText(order.status) }}</text>
          </view>
          <!-- 原有展开箭头 -->
          <image
              class="expand-icon"
              :src="order.expanded ? '/static/icons/arrow_up.png' : '/static/icons/arrow_down.png'"
              :class="{ rotated: order.expanded }"
          ></image>
        </view>

        <!-- 总价区域 - 添加点击事件 -->
        <view class="order-total" @click="toggleOrderDetail(order.id)">
          <text class="total-label">总价:</text>
          <text class="total-amount">¥{{ order.totalprice }}</text>
        </view>

        <!-- 原有展开详情区域 -->
        <view
            class="order-details"
            :class="{ expanded: order.expanded }"
        >
          <view class="details-inner">
            <view class="detail-item" v-for="(item, i) in order.materialList" :key="i">
              <text class="item-name">{{ item.materialName }}</text>
              <view class="item-info">
                <text class="item-price">¥{{ item.materialPrice }}</text>
                <text class="item-quantity">x{{ item.quantity }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 新增订单分隔线 -->
        <view class="order-divider" v-if="index !== filteredOrders.length - 1"></view>
      </view>
    </view>

    <!-- 加载、错误、空状态 -->
    <view class="loading-container" v-if="loading">...</view>
    <view class="error-container" v-if="error">...</view>
    <view class="empty-container" v-if="!loading && !error && orderList.length === 0">...</view>
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

// 新增标签逻辑
const tabs = ref([
  { name: '全部', status: null },    // null 表示不筛选
  { name: '配送中', status: 0 },     // 假设待发货=配送中（对应 status=0）
  { name: '已完成', status: 3 }      // 已完成对应 status=3
]);
const currentTab = ref(0); // 默认选中“全部”

onMounted(() => {
  fetchOrders();
});

// 获取订单数据
const fetchOrders = () => {
  loading.value = true;
  error.value = false;

  uni.request({
    url: `${baseUrl}/api/materialOrders`, // 替换为实际API路径
    method: 'GET',
    header: {
      'Content-Type': 'application/json',
      'Authorization': uni.getStorageSync('token') // 假设token存在本地存储中
    },
    success: (res) => {
      if (res.statusCode === 200) {
        if (res.data.code === 200 && res.data.data) {
          orderList.value = res.data.data.map(order => ({
            ...order,
            expanded: false,
            materialList: parseMaterialJson(order.material)
          }));
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
};

// 解析material JSON字符串并过滤null字段
const parseMaterialJson = (jsonStr) => {
  try {
    const materials = JSON.parse(jsonStr);
    return materials.map(item => {
      const filteredItem = {};
      // 只保留非null字段
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

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    0: '待发货',
    1: '已发货',
    2: '已付款',
    3: '已完成',
    4: '已取消'
  };
  return statusMap[status] || '未知状态';
};

// 获取状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    0: '#FF6600', // 橙色
    1: '#007AFF', // 蓝色
    2: '#34C759', // 绿色
    3: '#34C759', // 绿色
    4: '#8E8E93'  // 灰色
  };
  return colorMap[status] || '#333';
};

// 切换订单详情展开/折叠
const toggleOrderDetail = (orderId) => {
  orderList.value.forEach(item => {
    // 关闭其他订单
    if (item.id !== orderId) item.expanded = false;
    // 切换当前订单
    if (item.id === orderId) item.expanded = !item.expanded;
  });
};

// 切换标签逻辑
const switchTab = (index) => {
  currentTab.value = index;
};

// 筛选订单（根据当前标签）
const filteredOrders = computed(() => {
  const activeTab = tabs.value[currentTab.value];
  if (activeTab.status === null) {
    return orderList.value; // 全部订单
  }

  // 根据 status 筛选
  return orderList.value.filter(order => order.status === activeTab.status);
});

</script>

<style scoped>
/* 新增标签栏样式 */
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
  color: #007AFF; /* 选中态颜色 */
  border-bottom: 4rpx solid #007AFF;
}

/* 核心展开动画样式 */
.order-details {
  overflow: hidden;
  max-height: 0; /* 初始高度为0，隐藏内容 */
  transition: max-height 0.5s cubic-bezier(0, 1, 0, 1); /* 向下滑动的缓动曲线 */
}

/* 展开状态：通过动态计算高度实现滑动效果 */
.order-details.expanded {
  max-height: 1000rpx; /* 足够大的高度容纳内容 */
  transition: max-height 0.5s ease-in-out; /* 展开时的动画 */
}

/* 内部容器：确保padding不影响动画 */
.details-inner {
  padding: 0 20rpx 20rpx; /* 底部padding在展开后显示 */
}

/* 箭头旋转动画 */
.expand-icon {
  width: 32rpx;
  height: 32rpx;
  transition: transform 0.3s ease;
}
.expand-icon.rotated {
  transform: rotate(180deg); /* 展开时箭头向上旋转 */
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
  flex-direction: row; /* 改为行布局 */
  align-items: center;
  gap: 160rpx; /* 元素之间的间距 */
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
  font-size: 26rpx;
}

.expand-icon {
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

.order-details {
  padding: 0 20rpx 20rpx;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #F8F8F8;
}

.detail-item:last-child {
  border-bottom: none;
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

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 500rpx;
}

/* 给订单卡片添加底部边框，作为订单之间的间隔横线 */
/* 新增视觉区分样式 */
/* 订单卡片间距与边框强化 */
.order-card {
  margin-bottom: 30rpx;
  border: 1rpx solid #ECECEC;
  border-radius: 8rpx;
  background-color: #FFFFFF;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.02);
}

/* 新增分隔线（最后一个订单不显示） */
.order-divider {
  height: 40rpx;
  background-color: #FAFAFA;
  border-top: 1rpx solid #ECECEC;
}

</style>