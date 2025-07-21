<script setup lang="ts">
import { ref } from 'vue'

// 模拟数据
const todayIncome = ref(8560)
const yesterdayIncome = ref(7230)
const monthIncome = ref(125800)
const lastMonthIncome = ref(108500)

// 计算增减百分比
const dailyDiff = ((todayIncome.value - yesterdayIncome.value) / yesterdayIncome.value * 100).toFixed(1)
const monthlyDiff = ((monthIncome.value - lastMonthIncome.value) / lastMonthIncome.value * 100).toFixed(1)
</script>

<template>
  <div class="income-container">
    <h1>收入统计</h1>

    <div class="card">
      <h2>日收入</h2>
      <div class="amount">¥{{ todayIncome.toLocaleString() }}</div>
      <div class="comparison" :class="{ positive: dailyDiff > 0, negative: dailyDiff < 0 }">
        较昨日 {{ Math.abs(dailyDiff) }}% {{ dailyDiff > 0 ? '↑' : '↓' }}
      </div>
    </div>

    <div class="card">
      <h2>月收入</h2>
      <div class="amount">¥{{ monthIncome.toLocaleString() }}</div>
      <div class="comparison" :class="{ positive: monthlyDiff > 0, negative: monthlyDiff < 0 }">
        较上月 {{ Math.abs(monthlyDiff) }}% {{ monthlyDiff > 0 ? '↑' : '↓' }}
      </div>
    </div>
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