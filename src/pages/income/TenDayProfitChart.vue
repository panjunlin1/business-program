<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted, getCurrentInstance } from 'vue'
import { baseUrl } from "@/router";
import * as echarts from 'echarts';

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

// 定义接口返回数据类型
interface TenDayDataItem {
  shopId: number;
  income: number;
  outcome: number;
  netProfit: number;
  date: string;
}
interface TenDayResponse {
  code: number;
  msg: string;
  data: TenDayDataItem[];
}

// 数据响应式变量
const tenDayData = ref<TenDayDataItem[]>([]);
const loading = ref(true);
const errorMsg = ref('');

// 获取十日数据函数
const fetchTenDayData = async () => {
  if (!shopId.value) {
    errorMsg.value = 'shopId 为空，无法获取数据';
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    const queryParams = `?shopId=${shopId.value}`;
    const requestUrl = baseUrl + '/shop/queryTenDay' + queryParams;

    const response = await new Promise<TenDayResponse>((resolve, reject) => {
      uni.request({
        url: requestUrl,
        method: 'GET',
        success: (res) => {
          if (res.statusCode === 200) {
            console.log('接口返回十日数据:', res.data);
            resolve(res.data as TenDayResponse);
          } else {
            reject(new Error(`请求失败，状态码：${res.statusCode}`));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });

    // 关键修复：将 response.code === 0 改为 response.code === 200
    if (response.code === 200 && response.data) {
      tenDayData.value = response.data;
      errorMsg.value = '';
      // 新增：确认数据长度
      console.log('数据赋值成功，长度:', tenDayData.value.length);
    } else {
      errorMsg.value = response.msg || '获取数据失败';
    }

    nextTick(() => {
      renderChart();
    });
  } catch (error) {
    console.error('获取十日数据失败:', error);
    errorMsg.value = error instanceof Error ? error.message : '网络请求异常';
  } finally {
    loading.value = false;
  }
};

// 渲染 ECharts 图表函数
const renderChart = () => {
  if (tenDayData.value.length === 0) {
    console.log('数据为空，不渲染图表');
    return;
  }

  const instance = getCurrentInstance();
  if (!instance) return;

  const query = uni.createSelectorQuery().in(instance);
  query.select(`canvas[canvas-id="tenDayProfitChart"]`).node().exec((res) => {
    if (!res[0]) {
      console.error('未找到 canvas 元素');
      return;
    }
    const canvas = res[0].node;
    const ctx = canvas.getContext('2d');
    const dpr = uni.getSystemInfoSync().pixelRatio;
    canvas.width = res[0].width * dpr;
    canvas.height = res[0].height * dpr;
    ctx.scale(dpr, dpr);

    const myChart = echarts.init(canvas, null, {
      width: res[0].width,
      height: res[0].height,
    });

    // 处理数据
    const sortedData = [...tenDayData.value].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const xAxisData = sortedData.map(item => item.date);
    const seriesData = sortedData.map(item => item.netProfit);

    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c} 元' // 提示框显示完整日期和利润
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLabel: {
          rotate: 30,
          interval: 0,
          // 新增：格式化日期为 "日"（如 19日、20日）
          formatter: (value: string) => {
            return value.split('-')[2] + '日'; // 从 "2025-07-19" 提取 "19" 并添加 "日"
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value} 元'
        }
      },
      series: [
        {
          data: seriesData,
          type: 'line',
          name: '净利润',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 2
          },
          itemStyle: {
            color: '#409eff'
          }
        }
      ]
    };

    myChart.setOption(option);

    // 监听窗口大小变化
    const resizeHandler = () => {
      myChart.resize();
    };

    uni.onWindowResize(resizeHandler);

    // 组件卸载时清理
    onUnmounted(() => {
      uni.offWindowResize(resizeHandler);
      myChart.dispose();
    });
  });
};

// 组件挂载时获取数据
onMounted(() => {
  fetchTenDayData();
});
</script>

<template>
  <div class="profit-chart-container">
    <h2 class="chart-title">十日利润趋势</h2>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <uni-loading-icon size="24" color="#409eff"></uni-loading-icon>
      <p>正在加载数据...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="errorMsg" class="error-state">
      <uni-icons type="warn" size="24" color="#f56c6c"></uni-icons>
      <p>{{ errorMsg }}</p>
    </div>

    <!-- 图表容器 -->
    <canvas
      v-else-if="tenDayData.length > 0"
      canvas-id="tenDayProfitChart"
      class="chart-canvas"
      style="width: 100%; height: 400px;"
    ></canvas>

    <!-- 数据为空提示 -->
    <div v-else class="error-state">
      <uni-icons type="warn" size="24" color="#f56c6c"></uni-icons>
      <p>暂无十日利润数据</p>
    </div>
  </div>
</template>

<style scoped>
.profit-chart-container {
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.chart-title {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 500;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  gap: 12px;
}

.error-state {
  color: #f56c6c;
}

.chart-canvas {
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}
</style>

