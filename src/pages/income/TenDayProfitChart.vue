<script setup lang="ts">
import {ref, onMounted, nextTick, onUnmounted, getCurrentInstance} from 'vue'
import {baseUrl} from "@/router";
// 直接导入 uCharts
import uCharts from '../../static/u-charts/u-charts.js';

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
// 新增：在 setup 顶层获取组件实例
const instance = getCurrentInstance();
console.log('setup顶层获取实例:', instance);

// 新增：保存图表实例和canvas上下文
let chartInstance: any = null;
let canvasContext: any = null;

// 获取十日数据函数
const fetchTenDayData = async () => {
  loading.value = true;
  errorMsg.value = '';

  if (!shopId.value) {
    errorMsg.value = 'shopId 为空，无法获取数据';
    loading.value = false;
    return;
  }

  try {
    const queryParams = `?shopId=${shopId.value}`;
    const requestUrl = baseUrl + '/shop/queryTenDay' + queryParams;

    const response = await new Promise<TenDayResponse>((resolve, reject) => {
      uni.request({
        url: requestUrl,
        method: 'GET',
        success: (res) => {
          console.log('原始响应数据:', res);
          if (res.statusCode === 200) {
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


    console.log('处理后的响应:', response);
    if (response && response.code === 200 && response.data) {
      tenDayData.value = response.data;
      console.log('设置tenDayData:', tenDayData.value);
      errorMsg.value = '';
    } else {
      errorMsg.value = response?.msg || '获取数据失败';
    }
  } catch (error) {
    console.error('获取十日数据失败:', error);
    errorMsg.value = error instanceof Error ? error.message : '网络请求异常';
  } finally {
    loading.value = false;
  }

  // 在nextTick中渲染图表
  await nextTick(() => {
    console.log('准备渲染图表，数据状态:', {
      loading: loading.value,
      errorMsg: errorMsg.value,
      dataLength: tenDayData.value.length
    });
    if (!loading.value && !errorMsg.value && tenDayData.value.length > 0) {
      renderChart();
    }
  });
};

// 定义 canvas ID
const canvasId = 'tenDayProfitChart';

// 渲染 uCharts 图表函数
const renderChart = () => {
  console.log('进入renderChart，数据长度:', tenDayData.value.length);

  if (tenDayData.value.length === 0) {
    console.log('数据为空，不渲染图表');
    return;
  }

  // 延迟一小段时间确保 DOM 更新完成
  setTimeout(() => {
    try {
      // 在 uni-app 中获取 canvas 上下文
      const query = uni.createSelectorQuery().in(instance);

      query.select('#' + canvasId).fields({ context: true, size: true }).exec((res) => {
        console.log('Canvas查询结果:', res);
        if (!res || !res[0] || !res[0].context) {
          console.error('无法获取Canvas上下文');
          return;
        }

        // 保存canvas上下文
        canvasContext = res[0].context;

        // 处理数据
        const sortedData = [...tenDayData.value].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        console.log('排序后的数据:', sortedData);

        // 确保数据有效
        if (!sortedData || !Array.isArray(sortedData) || sortedData.length === 0) {
          console.error('排序后的数据无效:', sortedData);
          return;
        }

        const xAxisData = sortedData.map(item => {
          // 确保日期存在并格式化
          if (!item.date) return '未知日期';
          // 修复日期格式化问题，确保正确处理各种日期格式
          try {
            const date = new Date(item.date);
            if (isNaN(date.getTime())) {
              // 如果日期无效，返回原始值
              return item.date;
            }
            // 格式化日期为"月-日"（如 8-15、8-16）
            const month = date.getMonth() + 1;
            const day = date.getDate();
            return `${month}-${day}`;
          } catch (e) {
            // 出现异常时返回原始值
            return item.date;
          }
        });

        const seriesData = sortedData.map(item => {
          // 确保数值存在且是数字类型
          if (item.netProfit === undefined || item.netProfit === null) return 0;
          const num = Number(item.netProfit);
          return isNaN(num) ? 0 : parseFloat(num.toFixed(2)); // 保留两位小数
        });

        // 确保数据格式正确
        if (!xAxisData || !Array.isArray(xAxisData) || xAxisData.length === 0) {
          console.error('x轴数据无效:', xAxisData);
          return;
        }

        if (!seriesData || !Array.isArray(seriesData) || seriesData.length === 0) {
          console.error('系列数据无效:', seriesData);
          return;
        }

        // 确保两个数组长度一致
        if (xAxisData.length !== seriesData.length) {
          console.error('x轴数据和系列数据长度不一致:', xAxisData.length, seriesData.length);
          return;
        }

        // 进一步验证 seriesData 中的每个元素都是数字
        const validSeriesData = seriesData.every(item => typeof item === 'number' && !isNaN(item));
        if (!validSeriesData) {
          console.error('系列数据包含非数字项:', seriesData);
          return;
        }

        console.log('x轴数据:', xAxisData);
        console.log('系列数据:', seriesData);

        // 确保 canvas 尺寸有效
        const canvasWidth = res[0].width || 300;
        const canvasHeight = res[0].height || 400;

        if (canvasWidth <= 0 || canvasHeight <= 0) {
          console.error('Canvas 尺寸无效:', { width: canvasWidth, height: canvasHeight });
          return;
        }

        // 图表配置 - 原生 uCharts 配置
        const options = {
          canvasId: canvasId,
          type: 'line',
          categories: xAxisData,
          series: [{
            name: '净利润',
            data: seriesData,
            color: '#409eff',
            pointShape: 'circle',
            pointSize: 4,
            lineWidth: 2
          }],
          xAxis: {
            disableGrid: false,
            gridColor: '#f0f0f0',
            rotateLabel:true,
            marginTop: 5,
            fontSize: 5,
            fontColor: '#666666',
            itemGap: 10,
          },
          yAxis: {
            format: (val: number) => {
              // 添加对数值的验证
              if (isNaN(val)) return '0元';
              return val.toFixed(0) + '元';
            },
            min: 0,
            fontSize: 5,
            fontColor: '#666666',
            gridColor: '#f0f0f0',
            gridType: 'dash',
            dashLength: 4
          },
          width: canvasWidth,
          height: canvasHeight,
          pixelRatio: uni.getSystemInfoSync().pixelRatio || 1,
          dataLabel: true,
          dataPointShape: true,
          animation: true,
          fontSize: 5,
          background: '#ffffff',
          enableScroll: false,
          extra: {
            line: {
              type: 'curve',
              width: 2
            }
          },
          legend: {
            show: true,
            position: 'top',
            float: 'right', // 将图例浮动到右侧
            fontSize: 5,
            fontColor: '#333333'
          },
          padding: [15, 10, 10, 5]
        };

        // 清理之前的图表实例
        if (chartInstance) {
          try {
            // uCharts 没有提供 destroy 方法，我们只需要将引用设为 null
            chartInstance = null;
          } catch (e) {
            console.error('清理旧图表实例时出错:', e);
          }
          chartInstance = null; // 确保清空引用
        }

        console.log('准备创建图表，配置:', options);

        // 添加额外的验证确保 series.data 存在且为数组
        if (options.series &&
            Array.isArray(options.series) &&
            options.series.length > 0 &&
            options.series[0] &&
            Array.isArray(options.series[0].data) &&
            options.series[0].data.length > 0) {
          try {
            // 确保在创建新实例前没有旧实例
            if (!chartInstance) {
              console.log('uCharts 类型:', typeof uCharts);
              console.log('uCharts 内容:', uCharts);
              console.log('Canvas Context:', canvasContext);

              // 添加更多检查
              if (!canvasContext) {
                console.error('Canvas context 为空');
                errorMsg.value = '无法获取 Canvas 上下文';
                return;
              }

              // 检查 uCharts 的正确使用方式
              let chartOptions = {
                ...options,
                context: canvasContext
              };

              console.log('即将使用的图表配置:', chartOptions);

              // 在 uni-app 中使用 uCharts 的正确方式
              console.log('使用 new uCharts() 方式创建图表');
              // 修复：直接使用 uCharts 而不是 uCharts.default
              chartInstance = new uCharts(chartOptions);
              console.log('使用 new uCharts() 创建图表成功');
            } else {
              console.log('chartInstance:', chartInstance);
              if (chartInstance) {
                console.warn('图表实例已存在');
              }
            }
          } catch (error) {
            console.error('创建图表时发生错误:', error);
            console.error('错误堆栈:', error.stack);
            errorMsg.value = '创建图表失败: ' + error.message;
          }
        } else {
          console.error('图表数据格式不正确:', options.series);
          errorMsg.value = '图表数据格式不正确';
        }
      });
    } catch (error) {
      console.error('初始化图表时出错:', error);
      console.error('错误堆栈:', error.stack);
    }
  }, 100);
};

// 添加触摸事件处理函数
const tap = (e: any) => {
  if (chartInstance) {
    chartInstance.showToolTip(e, {
      format: (item: any, category: any) => {
        if (item && item.data !== undefined && !isNaN(item.data)) {
          return category + ': ' + parseFloat(item.data).toFixed(2) + ' 元';
        }
        return category + ': 0.00 元';
      }
    });
  }
};

const touchStart = (e: any) => {
  if (chartInstance) {
    chartInstance.scrollStart(e);
  }
};

const touchMove = (e: any) => {
  if (chartInstance) {
    chartInstance.scroll(e);
  }
};

const touchEnd = (e: any) => {
  if (chartInstance) {
    chartInstance.scrollEnd(e);
  }
};

// 在组件卸载时清理
onUnmounted(() => {
  if (chartInstance) {
    try {
      chartInstance = null;
    } catch (e) {
      console.error('组件卸载时销毁图表实例出错:', e);
    } finally {
      chartInstance = null; // 确保清空引用
    }
  }
});

// 导出函数供模板使用
defineExpose({
  tap,
  touchStart,
  touchMove,
  touchEnd
});

// 在组件挂载时获取数据
onMounted(() => {
  console.log('组件已挂载，开始获取十日数据');
  fetchTenDayData();
});
</script>

<template>
  <!-- 模板部分保持不变 -->
  <div class="profit-chart-container">
    <div class="chart-header">
      <div class="chart-title">十日利润趋势</div>
      <div class="chart-subtitle">最近10天的净利润变化</div>
    </div>

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
    <view v-else-if="tenDayData.length > 0" class="chart-wrapper">
      <canvas
          :id="canvasId"
          :canvas-id="canvasId"
          class="chart-canvas"
          style="width: 100%; height: 450px; margin: 10px 0;"
          @tap="tap"
          @touchstart="touchStart"
          @touchmove="touchMove"
          @touchend="touchEnd"
      ></canvas>

      <!-- 数据摘要 -->
      <div class="data-summary">
        <div class="summary-item">
          <div class="summary-label">最高利润</div>
          <div class="summary-value">
            ¥{{ Math.max(...tenDayData.map(item => item.netProfit || 0)).toFixed(2) }}
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-label">最低利润</div>
          <div class="summary-value">
            ¥{{ Math.min(...tenDayData.map(item => item.netProfit || 0)).toFixed(2) }}
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-label">平均利润</div>
          <div class="summary-value">
            ¥{{ (tenDayData.reduce((sum, item) => sum + (item.netProfit || 0), 0) / tenDayData.length).toFixed(2) }}
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-label">总利润</div>
          <div class="summary-value">
            ¥{{ tenDayData.reduce((sum, item) => sum + (item.netProfit || 0), 0).toFixed(2) }}
          </div>
        </div>
      </div>
    </view>

    <!-- 数据为空提示 -->
    <div v-else class="error-state">
      <uni-icons type="warn" size="24" color="#f56c6c"></uni-icons>
      <p>暂无十日利润数据</p>
    </div>
  </div>
</template>

<style scoped>
.profit-chart-container {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin: 20px;
  backdrop-filter: blur(4px);
}

.chart-header {
  margin-bottom: 20px;
  text-align: center;
}

.chart-title {
  color: #ffffff;
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  text-align: center;
  margin-top: 6px;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  gap: 16px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
}

.error-state {
  color: #f56c6c;
}

.chart-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.chart-canvas {
  border-radius: 8px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.data-summary {
  display: flex;
  justify-content: space-between;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7f4 100%);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  padding: 12px;
}

.summary-item:not(:last-child) {
  border-right: 1px solid rgba(0, 0, 0, 0.08);
}

.summary-label {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 500;
}

.summary-value {
  color: #303133;
  font-size: 18px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.7);
  padding: 6px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profit-chart-container {
    padding: 16px;
    margin: 16px;
  }

  .chart-title {
    font-size: 20px;
  }

  .chart-subtitle {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .profit-chart-container {
    padding: 12px;
    margin: 12px;
  }

  .chart-title {
    font-size: 18px;
  }

  .chart-subtitle {
    font-size: 12px;
  }

  .data-summary {
    flex-direction: column;
    gap: 12px;
  }

  .summary-item {
    flex-direction: row;
    justify-content: space-between;
    border-right: none !important;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .summary-item:last-child {
    border-bottom: none;
  }

  .summary-label, .summary-value {
    font-size: 14px;
  }

  .loading-state, .error-state {
    height: 300px;
  }

  .chart-wrapper {
    gap: 16px;
    padding: 12px;
  }
}
</style>

