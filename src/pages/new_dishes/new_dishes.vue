<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { baseUrl } from "@/router";

// 从本地缓存获取 userEntity
const getUserEntityFromStorage = () => {
  try {
    return uni.getStorageSync('userEntity');
  } catch (error) {
    console.error('获取本地缓存 userEntity 失败:', error);
    return null;
  }
};

// 获取 shopId
const userEntity = getUserEntityFromStorage();
const shopId = ref(userEntity && userEntity.shop ? userEntity.shop.id : null);

// 添加数据源
const items = ref<any[]>([]);

const fetchDishes = async () => {
  try {
    // 构建包含 shopId 的查询参数
    const queryParams = `?shopId=${shopId.value}`;
    // 拼接完整的请求 url
    const requestUrl = baseUrl + '/shop/getDishes' + queryParams;

    const response = await new Promise((resolve, reject) => {
      uni.request({
        url: requestUrl,
        method: 'GET',
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`请求失败，状态码：${res.statusCode}`));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });

    console.log(response);

    // 检查 response.data 是否为数组
    if (Array.isArray(response.data)) {
      // 对 response.data 调用 map 方法，添加 status 字段
      items.value = response.data.map((item: any) => ({
        ...item,
        dish_name: item.dishName, // 将 dishName 转换为 dish_name
        status: item.shopDishesIsAvailable === 1 ? '已上架' : '已下架' // 根据 shopDishesIsAvailable 判断状态
      }));
    } else {
      console.error('响应数据中的 data 字段不是数组类型', response);
    }
  } catch (error) {
    console.error('获取菜品信息失败:', error);
  }
};

const scrollTop = ref(0)
const old = ref({
  scrollTop: 0
})

const upper = (e: any) => {
  console.log(e)
}

const lower = (e: any) => {
  console.log(e)
}

const scroll = (e: any) => {
  console.log(e)
  old.value.scrollTop = e.detail.scrollTop
}

const goTop = (e: any) => {
  // 解决view层不同步的问题
  scrollTop.value = old.value.scrollTop
  nextTick(() => {
    scrollTop.value = 0
  })
  uni.showToast({
    icon: "none",
    title: "纵向滚动 scrollTop 值已被修改为 0"
  })
}
const navigateToAddDishes = () => {
  uni.navigateTo({
    url: '/pages/new_dishes/add_dishes'  // 跳转到add_dishes页面
  });
}
const navigateToDeleteDishes = () => {
  uni.navigateTo({
    url: '/pages/new_dishes/delete_dishes'  // 跳转到delete_dishes页面
  });
}

// 封装请求函数
const updateDishStatus = async (dishId: number, isAvailable: number) => {
  if (!shopId.value) {
    console.error('shopId 为空，无法更新菜品状态');
    uni.showToast({
      icon: 'none',
      title: '获取店铺信息失败，无法更新菜品状态'
    });
    return;
  }
  try {
    // 手动拼接查询字符串
    const queryParams = `shopId=${Number(shopId.value)}&dishId=${Number(dishId)}&isAvailable=${Number(isAvailable)}`;
    const url = `${baseUrl}/shop/updateIsAvailable?${queryParams}`;

    const response = await new Promise((resolve, reject) => {
      uni.request({
        url,
        method: 'POST',
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`请求失败，状态码：${res.statusCode}`));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
    return response;
  } catch (error) {
    console.error('更新菜品状态失败:', error);
    throw error;
  }
};

const onShelf = async (id: number) => {
  try {
    await updateDishStatus(id, 1);
    const item = items.value.find(i => i.id === id);
    if (item) {
      item.status = '已上架';
      item.shopDishesIsAvailable = 1; // 更新本地数据的 shopDishesIsAvailable 字段
    }
    uni.showToast({
      title: '菜品已上架',
      icon: 'success'
    });
  } catch (error) {
    uni.showToast({
      title: '上架失败，请重试',
      icon: 'none'
    });
  }
};

const offShelf = async (id: number) => {
  try {
    await updateDishStatus(id, 0);
    const item = items.value.find(i => i.id === id);
    if (item) {
      item.status = '已下架';
      item.shopDishesIsAvailable = 0; // 更新本地数据的 shopDishesIsAvailable 字段
    }
    uni.showToast({
      title: '菜品已下架',
      icon: 'success'
    });
  } catch (error) {
    uni.showToast({
      title: '下架失败，请重试',
      icon: 'none'
    });
  }
};

// 在组件挂载后调用 fetchDishes 函数
onMounted(() => {
  fetchDishes();
});
</script>

<template>
  <view class="container">
    <view class="header">
      <text class="header-title">菜品管理</text>
    </view>

    <view class="action-buttons">
      <button class="action-btn add-btn" @click="navigateToAddDishes">
        <text class="btn-text">添加菜品</text>
      </button>
      <button class="action-btn delete-btn" @click="navigateToDeleteDishes">
        <text class="btn-text">删除菜品</text>
      </button>
    </view>

    <view class="dish-list-container">
      <scroll-view
        :scroll-top="scrollTop"
        scroll-y="true"
        class="scroll-container"
        @scrolltoupper="upper"
        @scrolltolower="lower"
        @scroll="scroll"
      >
        <view v-if="items.length === 0" class="empty-state">
          <text class="empty-text">暂无菜品信息</text>
        </view>

        <!-- 使用 v-for 循环渲染视图 -->
        <view v-for="item in items" :key="item.id" class="dish-card">
          <view class="dish-content">
            <image
              :src="item.image || '/static/images/placeholder.png'"
              mode="aspectFill"
              class="dish-image"
            ></image>

            <view class="dish-details">
              <view class="dish-header">
                <text class="dish-name">{{ item.dish_name }}</text>
                <view :class="['status-badge', item.status === '已上架' ? 'status-available' : 'status-unavailable']">
                  {{ item.status }}
                </view>
              </view>

              <view class="dish-meta">
                <view class="meta-item">
                  <text class="meta-label">价格:</text>
                  <text class="price">¥{{ item.price }}</text>
                </view>
                <view class="meta-item">
                  <text class="meta-label">分类:</text>
                  <text class="category">{{ item.typeName }}</text>
                </view>
              </view>
            </view>
          </view>

          <view class="dish-actions">
            <button
              :class="['action-button', item.status === '已上架' ? 'secondary-btn' : 'primary-btn']"
              size="mini"
              @click.stop="item.status === '已上架' ? offShelf(item.id) : onShelf(item.id)"
            >
              {{ item.status === '已上架' ? '下架' : '上架' }}
            </button>
          </view>
        </view>
      </scroll-view>
    </view>

    <view @tap="goTop" class="back-to-top" v-if="scrollTop > 200">
      <text class="top-text">回到顶部</text>
    </view>
  </view>
</template>

<style scoped>
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  padding: 20rpx 0;
  text-align: center;
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.action-btn {
  flex: 1;
  border-radius: 12rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  font-weight: bold;
}

.add-btn {
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.3);
}

.delete-btn {
  background: linear-gradient(90deg, #F44336, #E91E63);
  box-shadow: 0 4rpx 12rpx rgba(244, 67, 54, 0.3);
}

.btn-text {
  color: white;
  font-size: 28rpx;
}

.dish-list-container {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.scroll-container {
  height: calc(100vh - 320rpx);
}

.empty-state {
  text-align: center;
  padding: 100rpx 0;
}

.empty-text {
  color: #999;
  font-size: 30rpx;
}

.dish-card {
  padding: 30rpx;
  border-bottom: 2rpx solid #f0f0f0;
  display: flex;
  flex-direction: column;
}

.dish-card:last-child {
  border-bottom: none;
}

.dish-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 20rpx;
}

.dish-image {
  width: 140rpx;
  height: 140rpx;
  border-radius: 12rpx;
  margin-right: 20rpx;
  background-color: #f0f0f0;
}

.dish-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.dish-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.dish-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
}

.status-badge {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: bold;
}

.status-available {
  background-color: #e8f5e9;
  color: #4CAF50;
}

.status-unavailable {
  background-color: #ffebee;
  color: #F44336;
}

.dish-meta {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-label {
  font-size: 24rpx;
  color: #999;
  margin-right: 10rpx;
  width: 80rpx;
}

.price {
  font-size: 28rpx;
  font-weight: bold;
  color: #F44336;
}

.category {
  font-size: 26rpx;
  color: #666;
}

.dish-actions {
  display: flex;
  justify-content: flex-end;
}

.action-button {
  border-radius: 8rpx;
  padding: 0 30rpx;
  height: 60rpx;
  line-height: 60rpx;
  font-size: 26rpx;
  border: none;
}

.primary-btn {
  background: linear-gradient(90deg, #2196F3, #03A9F4);
  color: white;
}

.secondary-btn {
  background-color: #e0e0e0;
  color: #666;
}

.back-to-top {
  position: fixed;
  right: 30rpx;
  bottom: 60rpx;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 15rpx 25rpx;
  border-radius: 30rpx;
  font-size: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

.top-text {
  color: white;
}
</style>