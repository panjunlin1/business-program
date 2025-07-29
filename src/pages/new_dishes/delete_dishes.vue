<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { baseUrl } from "@/router";

// 从本地缓存获取 userEntity
const getUserEntityFromStorage = () => {
  try {
    const userEntity = uni.getStorageSync('userEntity');
    return userEntity;
  } catch (error) {
    console.error('获取本地缓存 userEntity 失败:', error);
    return null;
  }
};

// 获取 shopId
const userEntity = getUserEntityFromStorage();
const shopId = ref(userEntity && userEntity.shop ? userEntity.shop.id : null);

// 添加数据源
const items = ref([
  // 可以继续添加更多项
])

const isLoading = ref(true);
const hasError = ref(false);

const fetchDishes = async () => {
  try {
    const queryParams = `?shopId=${shopId.value}`;
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

    console.log('接口返回数据:', response);

    if (Array.isArray(response.data)) {
      items.value = response.data.map((item: any) => ({
        ...item,
        dish_name: item.dishName,
      }));
    } else {
      console.error('响应数据中的 data 字段不是数组类型', response);
      hasError.value = true;
    }
  } catch (error) {
    console.error('获取菜品信息失败:', error);
    hasError.value = true;
  } finally {
    isLoading.value = false;
  }
};
// 在组件挂载时调用 fetchDishes 函数
onMounted(() => {
  fetchDishes();
});
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

const selectedItems = ref<number[]>([]); // 新增：存储选中的菜品ID

const toggleSelection = (id: number) => {
  const index = selectedItems.value.indexOf(id);
  if (index === -1) {
    selectedItems.value.push(id);
  } else {
    selectedItems.value.splice(index, 1);
  }
};

// 全选/取消全选功能
const toggleSelectAll = () => {
  if (selectedItems.value.length === items.value.length) {
    // 如果已经全选，则取消全选
    selectedItems.value = [];
  } else {
    // 否则全选
    selectedItems.value = items.value.map(item => item.id);
  }
};

const handleCancel = () => {
  // 取消操作后跳转并刷新页面
  uni.reLaunch({
    url: '/pages/new_dishes/new_dishes' // 替换为实际跳转的页面路径
  });
};

// 封装 uni.request 为 Promise 函数
const uniRequest = (options: UniApp.RequestOptions) => {
  return new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
    uni.request({
      ...options,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res);
        } else {
          reject(new Error(`请求失败，状态码：${res.statusCode}，响应信息：${res.data}`));
        }
      },
      fail: (err) => {
        reject(new Error(`请求失败，错误信息：${err.errMsg}`));
      }
    });
  });
};

const handleDelete = async () => {
  try {
    // 获取选中的 dishesId
    const selectedDishesId = selectedItems.value;
    if (selectedDishesId === null || selectedDishesId.length === 0) {
      console.error('请选择一个菜品');
      uni.showToast({
        icon: "none",
        title: "请选择一个菜品"
      });
      return;
    }

    const requestData = {
      shopId: shopId.value,
      dishesIds: selectedDishesId // 传递单个 Integer 类型
    };

    console.log('发送到后端的删除数据:', requestData);

    // 发送删除请求到后端
    const res = await uniRequest({
      url: baseUrl + '/shop/deleteShopDishes', // 使用删除接口
      method: 'POST',
      data: requestData
    });

    console.log('删除成功:', res.data);

    // 删除成功后，重新获取菜品列表
    await fetchDishes();

    // 清空选择
    selectedItems.value = [];

    uni.showToast({
      icon: "success",
      title: "删除成功"
    });
  } catch (error) {
    console.error('删除失败:', error);
    uni.showToast({
      icon: "none",
      title: error instanceof Error ? error.message : "删除失败，请重试"
    });
  }
};
</script>

<template>
  <view class="container">
    <view v-if="isLoading" class="loading-container">
      <text class="loading-text">加载中...</text>
    </view>
    <view v-else-if="hasError" class="error-container">
      <text class="error-text">加载失败，请重试</text>
    </view>
    <view v-else class="content">
      <view class="header">
        <text class="header-title">删除菜品</text>
      </view>

      <view class="instruction">
        <text class="instruction-text">请选择要删除的菜品</text>
      </view>

      <view class="action-buttons">
        <button class="action-btn delete-btn" @click="handleDelete">
          <text class="btn-text">删除选中</text>
        </button>
        <button class="action-btn cancel-btn" @click="handleCancel">
          <text class="btn-text">取消</text>
        </button>
      </view>

      <view class="select-all-container">
        <view class="select-all" @click="toggleSelectAll">
          <view :class="['checkbox', selectedItems.length === items.length && items.length > 0 ? 'checked' : '']">
            <text v-if="selectedItems.length === items.length && items.length > 0" class="checkmark">✓</text>
          </view>
          <text class="select-all-text">全选</text>
        </view>
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
          <view v-for="item in items" :key="item.id" class="dish-card" @click="toggleSelection(item.id)">
            <view class="dish-content">
              <image
                :src="item.image || '/static/images/placeholder.png'"
                mode="aspectFill"
                class="dish-image"
              ></image>

              <view class="dish-details">
                <view class="dish-header">
                  <text class="dish-name">{{ item.dish_name }}</text>
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

            <view class="selection-indicator">
              <view :class="['checkbox', selectedItems.includes(item.id) ? 'checked' : '']">
                <text v-if="selectedItems.includes(item.id)" class="checkmark">✓</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <view @tap="goTop" class="back-to-top" v-if="scrollTop > 200">
        <text class="top-text">回到顶部</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.loading-container, .error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.loading-text, .error-text {
  font-size: 30rpx;
  color: #666;
}

.content {
  height: 100%;
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

.instruction {
  background-color: #e3f2fd;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  text-align: center;
}

.instruction-text {
  color: #1976d2;
  font-size: 28rpx;
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

.delete-btn {
  background: linear-gradient(90deg, #F44336, #E91E63);
  box-shadow: 0 4rpx 12rpx rgba(244, 67, 54, 0.3);
}

.cancel-btn {
  background: linear-gradient(90deg, #9E9E9E, #607D8B);
  box-shadow: 0 4rpx 12rpx rgba(158, 158, 158, 0.3);
}

.btn-text {
  color: white;
  font-size: 28rpx;
}

.select-all-container {
  background-color: #fff;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.select-all {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.select-all-text {
  margin-left: 20rpx;
  font-size: 30rpx;
  color: #333;
}

.dish-list-container {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.scroll-container {
  height: calc(100vh - 450rpx);
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
  align-items: center;
}

.dish-card:last-child {
  border-bottom: none;
}

.dish-card:active {
  background-color: #f5f5f5;
}

.dish-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 1;
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

.selection-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 20rpx;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox.checked {
  background-color: #4CAF50;
  border-color: #4CAF50;
}

.checkmark {
  color: white;
  font-weight: bold;
  font-size: 24rpx;
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