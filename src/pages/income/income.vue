<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { baseUrl } from "@/router";
import TenDayProfitChart from './TenDayProfitChart.vue';
import ai from './ai.vue'
// 从本地缓存获取 userEntity
const getUserEntityFromStorage = () => {
  try {
    const storedData = uni.getStorageSync('userEntity');
    console.log('获取到的 userEntity 缓存数据:', storedData);
    return storedData;
  } catch (error) {
    console.error('获取本地缓存 userEntity 失败:', error);
    return null;
  }
};

// 获取 shopId
const userEntity = getUserEntityFromStorage();
const shopId = ref(userEntity && userEntity.shop ? userEntity.shop.id : null);

// 数据引用
const dailyNetProfit = ref(0)
const yesterdayNetProfit = ref(0)
const monthlyNetProfit = ref(0)
const lastMonthNetProfit = ref(0)

// 计算增减百分比
const dailyDiff = ref('0.0')
const monthlyDiff = ref('0.0')

// 计算百分比的工具函数（修复除以0的问题）
const calculateDiff = (current: number, previous: number) => {
  // 处理前值为0的情况，避免除以0
  if (previous === 0) {
    return current > 0 ? '100.0' : '0.0';
  }
  const diff = ((current - previous) / previous) * 100;
  return diff.toFixed(1);
};

// 定义获取收入数据的函数
const fetchIncomeData = async () => {
  if (!shopId.value) {
    console.error('shopId 为空，无法获取收入数据');
    return;
  }
  try {
    const queryParams = `?shopId=${shopId.value}`;
    const requestUrl = baseUrl + '/shop/queryDetail' + queryParams;

    const response = await new Promise<{
      code: number;
      msg: string;
      data: Array<{
        dailyNetProfit: number;
        yesterdayNetProfit: number;
        monthlyNetProfit: number;
        lastMonthNetProfit: number;
      }>;
    }>((resolve, reject) => {
      uni.request({
        url: requestUrl,
        method: 'GET',
        success: (res) => {
          if (res.statusCode === 200) {
            console.log('接口返回数据:', res.data);
            resolve(res.data as any);
          } else {
            reject(new Error(`请求失败，状态码：${res.statusCode}`));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });

    // 从数组的第一个元素中获取数据
    const incomeData = response.data[0];
    if (incomeData) {
      // 确保获取到的数据是数字类型
      dailyNetProfit.value = Number(incomeData.dailyNetProfit) || 0;
      yesterdayNetProfit.value = Number(incomeData.yesterdayNetProfit) || 0;
      monthlyNetProfit.value = Number(incomeData.monthlyNetProfit) || 0;
      lastMonthNetProfit.value = Number(incomeData.lastMonthNetProfit) || 0;

      // 计算增减百分比
      dailyDiff.value = calculateDiff(dailyNetProfit.value, yesterdayNetProfit.value);
      monthlyDiff.value = calculateDiff(monthlyNetProfit.value, lastMonthNetProfit.value);
    } else {
      console.error('未获取到有效的收入数据');
    }
  } catch (error) {
    console.error('获取收入数据失败:', error);
  }
};

// 组件挂载时调用获取数据函数
onMounted(() => {
  fetchIncomeData();
});
</script>

<template>
  <div class="income-container">
    <div class="header">
      <h1 class="page-title">收入统计</h1>
      <div class="header-divider"></div>
    </div>

    <div class="stats-grid">
      <div class="card daily-card">
        <div class="card-icon">
          <uni-icons type="compose" size="24" color="#ffffff"></uni-icons>
        </div>
        <div class="card-content">
          <h2 class="card-title">日净利润</h2>
          <div class="amount">¥{{ (dailyNetProfit || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}</div>
          <div class="comparison"
               :class="{
                 positive: Number(dailyDiff) > 0,
                 negative: Number(dailyDiff) < 0,
                 neutral: Number(dailyDiff) === 0
               }">
            <uni-icons :type="Number(dailyDiff) > 0 ? 'arrow-up' : (Number(dailyDiff) < 0 ? 'arrow-down' : 'arrow-right')"
                       :color="Number(dailyDiff) > 0 ? '#4caf50' : (Number(dailyDiff) < 0 ? '#f44336' : '#9e9e9e')"
                       size="14"></uni-icons>
            较昨日 {{ dailyDiff }}%
          </div>
        </div>
      </div>

      <div class="card monthly-card">
        <div class="card-icon">
          <uni-icons type="calendar" size="24" color="#ffffff"></uni-icons>
        </div>
        <div class="card-content">
          <h2 class="card-title">月净利润</h2>
          <div class="amount">¥{{ (monthlyNetProfit || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}</div>
          <div class="comparison"
               :class="{
                 positive: Number(monthlyDiff) > 0,
                 negative: Number(monthlyDiff) < 0,
                 neutral: Number(monthlyDiff) === 0
               }">
            <uni-icons :type="Number(monthlyDiff) > 0 ? 'arrow-up' : (Number(monthlyDiff) < 0 ? 'arrow-down' : 'arrow-right')"
                       :color="Number(monthlyDiff) > 0 ? '#4caf50' : (Number(monthlyDiff) < 0 ? '#f44336' : '#9e9e9e')"
                       size="14"></uni-icons>
            较上月 {{ monthlyDiff }}%
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="chart-section">
    <ai />
  </div>
  <div class="chart-section">
    <TenDayProfitChart />
  </div>
</template>

<style scoped>
.income-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 10px;
}

.header-divider {
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, #409eff, #64b5f6);
  margin: 0 auto;
  border-radius: 2px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  display: flex;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
}

.daily-card::before {
  background: linear-gradient(90deg, #409eff, #64b5f6);
}

.monthly-card::before {
  background: linear-gradient(90deg, #7e57c2, #9575cd);
}

.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  flex-shrink: 0;
}

.daily-card .card-icon {
  background: linear-gradient(135deg, #409eff, #64b5f6);
}

.monthly-card .card-icon {
  background: linear-gradient(135deg, #7e57c2, #9575cd);
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #666666;
  margin: 0 0 8px 0;
}

.amount {
  font-size: 26px;
  font-weight: 700;
  margin: 10px 0;
  color: #333333;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

.comparison {
  font-size: 14px;
  display: flex;
  align-items: center;
}

.positive {
  color: #4caf50;
}

.negative {
  color: #f44336;
}

.neutral {
  color: #9e9e9e;
}

.chart-section {
  margin-bottom: 20px;
}

.chart-section:last-child {
  margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .income-container {
    padding: 15px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .page-title {
    font-size: 24px;
  }

  .amount {
    font-size: 22px;
  }
}

@media (max-width: 480px) {
  .income-container {
    padding: 12px;
  }

  .card {
    padding: 16px;
  }

  .card-icon {
    width: 45px;
    height: 45px;
    margin-right: 12px;
  }

  .card-title {
    font-size: 15px;
  }

  .amount {
    font-size: 20px;
  }

  .comparison {
    font-size: 13px;
  }
}
</style>
