<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from 'vue'
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
const selectedCategory = ref('全部');
const searchKeyword = ref('');
const showFilterPanel = ref(false);

// 计算菜品分类列表
const categories = computed(() => {
  const categorySet = new Set<string>();
  items.value.forEach(item => {
    if (item.typeName) {
      categorySet.add(item.typeName);
    }
  });
  return ['全部', ...Array.from(categorySet)];
});

// 计算筛选后的菜品列表
const filteredItems = computed(() => {
  let result = items.value;

  // 按分类筛选
  if (selectedCategory.value !== '全部') {
    result = result.filter(item => item.typeName === selectedCategory.value);
  }

  // 按关键字搜索（菜品名称）
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(item =>
      item.dish_name.toLowerCase().includes(keyword) ||
      (item.typeName && item.typeName.toLowerCase().includes(keyword))
    );
  }

  return result;
});

// 当前筛选条件描述
const filterDescription = computed(() => {
  const conditions = [];
  if (searchKeyword.value) {
    conditions.push(`搜索"${searchKeyword.value}"`);
  }
  if (selectedCategory.value !== '全部') {
    conditions.push(`分类"${selectedCategory.value}"`);
  }
  return conditions.length > 0 ? conditions.join('，') : '全部菜品';
});

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

// 清除搜索关键字
const clearSearch = () => {
  searchKeyword.value = '';
};

// 显示筛选面板
const toggleFilterPanel = () => {
  showFilterPanel.value = !showFilterPanel.value;
};

// 关闭筛选面板
const closeFilterPanel = () => {
  showFilterPanel.value = false;
};

// 重置所有筛选条件
const resetFilters = () => {
  searchKeyword.value = '';
  selectedCategory.value = '全部';
};

// 应用筛选条件
const applyFilters = () => {
  showFilterPanel.value = false;
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

    <!-- 筛选控制栏 -->
    <view class="filter-control">
      <view class="filter-summary">
        <text class="filter-text">筛选: {{ filterDescription }}</text>
      </view>
      <button class="filter-button" @click="toggleFilterPanel">
        <image class="filter-icon" src="/static/icon/screening.png" ></image>
        <text class="filter-btn-text">筛选</text>
      </button>
    </view>

    <!-- 菜品列表 -->
    <view class="dish-list-container">
      <scroll-view
        :scroll-top="scrollTop"
        scroll-y="true"
        class="scroll-container"
        @scrolltoupper="upper"
        @scrolltolower="lower"
        @scroll="scroll"
      >
        <view class="results-info" v-if="searchKeyword || selectedCategory !== '全部'">
          <text class="results-text">找到 {{ filteredItems.length }} 个结果</text>
          <text class="clear-filter" @click="resetFilters">清除筛选</text>
        </view>

        <view v-if="filteredItems.length === 0" class="empty-state">
          <text class="empty-text">暂无匹配的菜品信息</text>
        </view>

        <!-- 使用 v-for 循环渲染视图 -->
        <view v-for="item in filteredItems" :key="item.id" class="dish-card">
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

    <!-- 筛选面板 -->
    <view v-if="showFilterPanel" class="filter-overlay" @click="closeFilterPanel">
      <view class="filter-panel" @click.stop>
        <view class="filter-header">
          <text class="filter-title">筛选条件</text>
          <text class="close-icon" @click="closeFilterPanel">×</text>
        </view>

        <!-- 搜索框 -->
        <view class="filter-section">
          <text class="section-title">搜索</text>
          <view class="search-container">
            <view class="search-box">
              <image class="search-icon" src="/static/icon/search.png" ></image>
<!--              <text class="search-icon">🔍</text>-->
              <input
                class="search-input"
                placeholder="搜索菜品名称或分类"
                v-model="searchKeyword"
                @confirm="applyFilters"
              />
              <text v-if="searchKeyword" class="clear-icon" @click="clearSearch">×</text>
            </view>
          </view>
        </view>

        <!-- 分类筛选 -->
        <view class="filter-section">
          <text class="section-title">分类</text>
          <view class="category-grid">
            <view
              v-for="category in categories"
              :key="category"
              :class="['category-item', selectedCategory === category ? 'active' : '']"
              @click="selectedCategory = category"
            >
              <text class="category-text">{{ category }}</text>
            </view>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="filter-actions">
          <button class="reset-btn" @click="resetFilters">重置</button>
          <button class="apply-btn" @click="applyFilters">应用</button>
        </view>
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

/* 筛选控制栏 */
.filter-control {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  padding: 20rpx;
}

.filter-summary {
  flex: 1;
}

.filter-text {
  font-size: 28rpx;
  color: #666;
}

.filter-button {
  display: flex;
  align-items: center;
  background-color: #2196F3;
  border: none;
  border-radius: 6rpx;
  padding: 6rpx 12rpx;
}

.filter-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 6rpx;
}

.filter-btn-text {
  color: white;
  font-size: 24rpx;
}

/* 菜品列表 */
.dish-list-container {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.scroll-container {
  height: calc(100vh - 420rpx);
}

.results-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background-color: #e3f2fd;
}

.results-text {
  color: #1976d2;
  font-size: 26rpx;
}

.clear-filter {
  color: #f44336;
  font-size: 24rpx;
  text-decoration: underline;
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

/* 筛选面板 */
.filter-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.filter-panel {
  width: 90%;
  max-width: 600rpx;
  background-color: white;
  border-radius: 16rpx;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.filter-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.close-icon {
  font-size: 40rpx;
  color: #999;
  padding: 10rpx;
}

.filter-section {
  padding: 20rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

/* 搜索框样式 */
.search-container {
  margin-bottom: 10rpx;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 30rpx;
  padding: 10rpx 20rpx;
}

.search-icon {
  width: 36rpx;
  height: 36rpx;
  margin-right: 10rpx;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 28rpx;
  outline: none;
  padding: 10rpx 0;
}

.clear-icon {
  font-size: 36rpx;
  color: #999;
  padding: 10rpx;
}

.clear-filter {
  color: #f44336;
  font-size: 24rpx;
  text-decoration: underline;
}

/* 分类网格 */
.category-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.category-item {
  padding: 15rpx 30rpx;
  border-radius: 30rpx;
  background-color: #f5f5f5;
  transition: all 0.3s;
}

.category-item.active {
  background: linear-gradient(90deg, #2196F3, #03A9F4);
}

.category-item.active .category-text {
  color: white;
}

.category-text {
  font-size: 26rpx;
  color: #666;
}

/* 筛选操作按钮 */
.filter-actions {
  display: flex;
  padding: 20rpx;
  gap: 20rpx;
}

.reset-btn, .apply-btn {
  flex: 1;
  border-radius: 8rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  border: none;
}

.reset-btn {
  background-color: #f5f5f5;
  color: #666;
}

.apply-btn {
  background: linear-gradient(90deg, #2196F3, #03A9F4);
  color: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-panel {
    width: 95%;
  }

  .category-grid {
    gap: 15rpx;
  }

  .category-item {
    padding: 12rpx 25rpx;
  }
}
</style>