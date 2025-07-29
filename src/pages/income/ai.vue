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
    <h1>菜品销售统计</h1>

    <div v-if="dishSalesList.length === 0" class="no-data">
      暂无数据
    </div>

    <div v-else class="sales-list">
      <div
        v-for="(dish, index) in dishSalesList"
        :key="dish.dishId"
        class="dish-item"
        :class="{ 'highlight': index % 2 === 0 }"
      >
        <div class="dish-info">
          <div class="dish-name">{{ dish.dishName }}</div>
          <div class="dish-id">ID: {{ dish.dishId }}</div>
        </div>
        <div class="sales-info">
          <div class="quantity">销量: {{ dish.salesQuantity }}</div>
          <div class="income">收入: ¥{{ dish.totalIncome.toFixed(2) }}</div>
        </div>
      </div>
    </div>

    <!-- AI分析按钮 -->
    <div class="ai-analysis-section">
      <div class="button-container">
        <button
          class="ai-btn"
          @click="fetchAiAnalysis"
          :disabled="loading"
        >
          {{ loading ? '分析中...' : 'AI智能分析' }}
        </button>
      </div>

      <!-- 加载提示 -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>AI正在分析数据中，请稍候...</p>
      </div>

      <!-- AI分析结果 -->
      <div v-if="aiAnalysis" class="ai-analysis-result">
        <h2>AI分析结果</h2>
        <div class="analysis-content">{{ aiAnalysis }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dish-sales-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

h2 {
  margin-top: 30px;
  margin-bottom: 15px;
  color: #333;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 16px;
}

.dish-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  margin-bottom: 10px;
  border-radius: 8px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.dish-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dish-item.highlight {
  background-color: #ffffff;
}

.dish-info {
  flex: 1;
}

.dish-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.dish-id {
  font-size: 14px;
  color: #999;
}

.sales-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.quantity {
  font-size: 16px;
  color: #666;
  margin-bottom: 5px;
}

.income {
  font-size: 18px;
  font-weight: bold;
  color: #4caf50;
}

.ai-analysis-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.button-container {
  display: flex;
  justify-content: flex-end;
}

.ai-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 12px 24px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.ai-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.ai-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0;
  color: #666;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-right: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.ai-analysis-result {
  margin-top: 20px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.analysis-content {
  white-space: pre-line;
  line-height: 1.6;
}

.analysis-content strong {
  color: #333;
  font-weight: bold;
}
</style>