<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { baseUrl } from "@/router";

// 从本地缓存获取 userEntity
const getUserEntityFromStorage = () => {
  try {
    const storedData = uni.getStorageSync('userEntity');
    return storedData;
  } catch (error) {
    console.error('获取本地缓存 userEntity 失败:', error);
    return null;
  }
};

// 获取 shopId
const userEntity = getUserEntityFromStorage();
const shopId = ref(userEntity && userEntity.shop ? userEntity.shop.id : null);

// 定义菜品销售数据类型
interface DishSales {
  dishId: number;
  dishName: string;
  salesQuantity: number;
  totalIncome: number;
}

// 菜品销售数据
const dishSalesList = ref<DishSales[]>([]);

// AI分析结果
const aiAnalysis = ref<string>('');

// 加载状态
const loading = ref<boolean>(false);

// 获取菜品销售数据
const fetchDishSalesData = async () => {
  if (!shopId.value) {
    console.error('shopId 为空，无法获取菜品销售数据');
    return;
  }

  try {
    const queryParams = `?shopId=${shopId.value}`;
    const requestUrl = baseUrl + '/shop/DishSales' + queryParams;

    uni.request({
      url: requestUrl,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const response: any = res.data;
          if (response.code === 200 && response.data) {
            dishSalesList.value = response.data;
          } else {
            console.error('接口返回数据格式不正确:', response);
          }
        } else {
          console.error('请求失败，状态码：', res.statusCode);
        }
      },
      fail: (err) => {
        console.error('请求失败:', err);
      }
    });
  } catch (error) {
    console.error('获取菜品销售数据失败:', error);
  }
};

// 获取AI分析数据
const fetchAiAnalysis = async () => {
  if (!shopId.value) {
    console.error('shopId 为空，无法获取AI分析数据');
    return;
  }

  // 设置加载状态
  loading.value = true;
  aiAnalysis.value = '';

  try {
    const queryParams = `?shopId=${shopId.value}`;
    const requestUrl = baseUrl + '/shop/ai/analyze/dishsales/byShop' + queryParams;

    uni.request({
      url: requestUrl,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const response: any = res.data;
          if (response.code === 200 && response.msg) {
            aiAnalysis.value = response.msg;
          } else {
            console.error('接口返回数据格式不正确:', response);
          }
        } else {
          console.error('请求失败，状态码：', res.statusCode);
        }
      },
      fail: (err) => {
        console.error('请求失败:', err);
      },
      complete: () => {
        // 请求完成后关闭加载状态
        loading.value = false;
      }
    });
  } catch (error) {
    console.error('获取AI分析数据失败:', error);
    loading.value = false;
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchDishSalesData();
});
</script>

<template>
  <div class="dish-sales-container">
    <div class="header">
      <h1 class="page-title">菜品销售统计</h1>
      <div class="header-divider"></div>
    </div>

    <div v-if="dishSalesList.length === 0" class="no-data">
      <uni-icons type="info" size="40" color="#ccc"></uni-icons>
      <p>暂无菜品销售数据</p>
    </div>

    <div v-else class="sales-list">
      <div class="list-header">
        <div class="header-item">菜品信息</div>
        <div class="header-item text-right">销量</div>
        <div class="header-item text-right">收入</div>
      </div>

      <div
        v-for="(dish, index) in dishSalesList"
        :key="dish.dishId"
        class="dish-item"
        :class="{ 'highlight': index % 2 === 0 }"
      >
        <div class="dish-info">
          <div class="dish-name">
            <span class="rank-badge" v-if="index < 3">{{ index + 1 }}</span>
            {{ dish.dishName }}
          </div>
          <div class="dish-details">
            <div class="dish-id">ID: {{ dish.dishId }}</div>
          </div>
        </div>
        <div class="quantity-info">
          <div class="quantity-mobile"> {{ dish.salesQuantity }}</div>
        </div>
        <div class="sales-info">
          <div class="income">¥{{ dish.totalIncome.toFixed(2) }}</div>
        </div>
      </div>
    </div>

    <!-- AI分析按钮 -->
    <div class="ai-analysis-section">
      <div class="section-header">
        <h2 class="section-title">AI智能分析</h2>
        <div class="header-divider small"></div>
      </div>

      <div class="button-container">
        <button
          class="ai-btn"
          @click="fetchAiAnalysis"
          :disabled="loading"
        >
          <uni-icons v-if="!loading" type="paperplane" size="18" color="#fff"></uni-icons>
          <uni-icons v-if="loading" type="spinner-cycle" size="18" color="#fff" class="rotating"></uni-icons>
          <span>{{ loading ? '分析中...' : '开始分析' }}</span>
        </button>
      </div>

      <!-- 加载提示 -->
      <div v-if="loading" class="loading">
        <div class="loading-animation">
          <div class="dot-loader">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
        <div class="loading-text">
          <p>AI正在分析数据中，请稍候...</p>
        </div>
      </div>

      <!-- AI分析结果 -->
      <div v-if="aiAnalysis" class="ai-analysis-result">
        <div class="result-header">
          <uni-icons type="chat" size="20" color="#409eff"></uni-icons>
          <h3>分析结果</h3>
        </div>
        <div class="analysis-content">
          <p>{{ aiAnalysis }}</p>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.quantity-mobile {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  background-color: #f0f2f5;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
  margin-right: 40px;
}
.dish-sales-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 16px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 10px;
}

.header-divider {
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, #409eff, #64b5f6);
  margin: 0 auto;
  border-radius: 2px;
}

.header-divider.small {
  width: 40px;
  height: 3px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  padding: 12px 20px;
  background: linear-gradient(135deg, #409eff, #64b5f6);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.header-item {
  flex: 1;
}

.text-right {
  text-align: right;
}

.dish-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  margin-bottom: 12px;
  border-radius: 12px;
  background-color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.dish-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.dish-item.highlight {
  background-color: #f8f9ff;
}

.dish-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: linear-gradient(to bottom, #409eff, #64b5f6);
}

.dish-item.highlight::before {
  background: linear-gradient(to bottom, #7e57c2, #9575cd);
}

.dish-info {
  flex: 1;
}

.rank-badge {
  display: inline-block;
  width: 22px;
  height: 22px;
  line-height: 22px;
  text-align: center;
  background: linear-gradient(135deg, #ff9800, #ff5722);
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  margin-right: 10px;
}

.dish-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
}

.dish-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.dish-id {
  font-size: 13px;
  color: #909399;
}

.quantity-mobile {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  background-color: #f0f2f5;
  padding: 2px 8px;
  border-radius: 10px;
  align-self: flex-start;
}

.sales-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.quantity {
  font-size: 18px;
  color: #606266;
  margin-bottom: 5px;
  font-weight: 500;
  display: none; /* 在大屏幕上隐藏，只在移动端显示 */
}

.income {
  font-size: 20px;
  font-weight: 700;
  color: #409eff;
}

/* 响应式设计 - 在大屏幕上显示桌面版布局 */
@media (min-width: 769px) {
  .quantity-mobile {
    display: none; /* 在大屏幕上隐藏移动端销量 */
  }

  .quantity {
    display: block; /* 在大屏幕上显示桌面版销量 */
  }
}

@media (max-width: 768px) {
  .dish-sales-container {
    padding: 15px;
  }

  .page-title {
    font-size: 24px;
  }

  .dish-item {
    padding: 14px 16px;
  }

  .dish-name {
    font-size: 16px;
  }

  .quantity, .income {
    font-size: 16px;
  }

  .ai-btn {
    padding: 12px 24px;
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .dish-sales-container {
    padding: 12px;
  }

  .page-title {
    font-size: 22px;
  }

  .list-header {
    font-size: 14px;
    padding: 10px 15px;
  }

  .dish-item {
    padding: 12px 15px;
  }

  .dish-name {
    font-size: 15px;
  }

  .dish-id {
    font-size: 12px;
  }

  .quantity-mobile {
    font-size: 13px;
  }

  .income {
    font-size: 17px;
  }

  .section-title {
    font-size: 20px;
  }

  .ai-analysis-result {
    padding: 20px;
  }
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
}

.loading-animation {
  margin-bottom: 15px;
}

.dot-loader {
  display: flex;
  justify-content: center;
  align-items: center;
}

.dot {
  width: 12px;
  height: 12px;
  margin: 0 5px;
  background-color: #409eff;
  border-radius: 50%;
  animation: bounce 1.5s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.loading-text p {
  color: #606266;
  font-size: 16px;
  margin: 0;
}
</style>