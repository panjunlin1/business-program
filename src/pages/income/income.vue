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
    <h1>收入统计</h1>

    <div class="card">
      <h2>日净利润</h2>
      <div class="amount">¥{{ (dailyNetProfit || 0).toLocaleString() }}</div>
      <div class="comparison"
           :class="{
             positive: Number(dailyDiff) > 0,
             negative: Number(dailyDiff) < 0
           }">
        较昨日 {{ dailyDiff }}% {{ Number(dailyDiff) > 0 ? '↑' : '↓' }}
      </div>
    </div>

    <div class="card">
      <h2>月净利润</h2>
      <div class="amount">¥{{ (monthlyNetProfit || 0).toLocaleString() }}</div>
      <div class="comparison"
           :class="{
             positive: Number(monthlyDiff) > 0,
             negative: Number(monthlyDiff) < 0
           }">
        较上月 {{ monthlyDiff }}% {{ Number(monthlyDiff) > 0 ? '↑' : '↓' }}
      </div>
    </div>
  </div>

  <div>
    <ai />
  </div>
    <div>
      <TenDayProfitChart />
    </div>
</template>

<style scoped>
.income-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.amount {
  font-size: 28px;
  font-weight: bold;
  margin: 10px 0;
}

.comparison {
  font-size: 16px;
}

.positive {
  color: #4caf50;
}

.negative {
  color: #f44336;
}
</style>
