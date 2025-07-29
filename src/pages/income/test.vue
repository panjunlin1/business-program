<template>
  <view class="line-chart-container">
    <view class="chart-title">销售数据统计</view>
    <view style="width: 100%; height: 400px;">
      <canvas
        type="2d"
        id="lineChart"
        canvas-id="lineChart"
        class="chart-canvas"
        style="width: 100%; height: 400px;"
      ></canvas>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import * as echarts from 'echarts'

// 获取组件实例
const instance = getCurrentInstance()

// 定义 canvas ID
const canvasId = 'lineChart'

// 渲染 ECharts 图表函数
const renderChart = () => {
  console.log('开始渲染图表')

  // 延迟一小段时间确保 DOM 更新完成
  setTimeout(() => {
    try {
      // 在 uni-app 中正确初始化 echarts
      const query = uni.createSelectorQuery().in(instance)

      console.log('执行Canvas查询')
      // 使用不同平台的兼容方式获取节点
      query.select('#' + canvasId).fields({
        node: true,
        size: true
      }).exec((res) => {
        console.log('Canvas查询结果:', res)
        if (!res || !res[0] || !res[0].node) {
          console.error('无法获取Canvas节点')
          // 如果第一次查询失败，再尝试一次
          setTimeout(() => {
            retryQuery()
          }, 200)
          return
        }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = uni.getSystemInfoSync().pixelRatio

        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.scale(dpr, dpr)

        const myChart = echarts.init(canvas)

        // 示例数据
        const xAxisData = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
        const seriesData = [820, 932, 901, 934, 1290, 1330, 1320, 1200, 1000, 800, 1100, 1300]

        const option = {
          title: {
            text: '年度销售数据'
          },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c} 万元'
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
              rotate: 30
            }
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              formatter: '{value} 万元'
            }
          },
          series: [
            {
              data: seriesData,
              type: 'line',
              name: '销售额',
              smooth: true,
              symbol: 'circle',
              symbolSize: 8,
              lineStyle: {
                width: 2
              },
              itemStyle: {
                color: '#409eff'
              },
              areaStyle: {
                color: '#409eff',
                opacity: 0.3
              }
            }
          ]
        }

        myChart.setOption(option)

        // 监听窗口大小变化
        const resizeHandler = () => {
          myChart.resize()
        }

        uni.onWindowResize && uni.onWindowResize(resizeHandler)

        // 组件卸载时清理
        onUnmounted(() => {
          uni.offWindowResize && uni.offWindowResize(resizeHandler)
          myChart.dispose()
        })
      })
    } catch (error) {
      console.error('初始化图表时出错:', error)
    }
  }, 200) // 延迟200毫秒以确保DOM渲染完成
}

// 重试查询函数
const retryQuery = () => {
  try {
    const query = uni.createSelectorQuery().in(instance)
    query.select('#' + canvasId).fields({
      node: true,
      size: true
    }).exec((res) => {
      console.log('重试查询结果:', res)
      if (!res || !res[0] || !res[0].node) {
        console.error('重试后仍然无法获取Canvas节点')
        return
      }

      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = uni.getSystemInfoSync().pixelRatio

      canvas.width = res[0].width * dpr
      canvas.height = res[0].height * dpr
      ctx.scale(dpr, dpr)

      const myChart = echarts.init(canvas)

      // 示例数据
      const xAxisData = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
      const seriesData = [820, 932, 901, 934, 1290, 1330, 1320, 1200, 1000, 800, 1100, 1300]

      const option = {
        title: {
          text: '年度销售数据'
        },
        tooltip: {
          trigger: 'axis',
          formatter: '{b}: {c} 万元'
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
            rotate: 30
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '{value} 万元'
          }
        },
        series: [
          {
            data: seriesData,
            type: 'line',
            name: '销售额',
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            lineStyle: {
              width: 2
            },
            itemStyle: {
              color: '#409eff'
            },
            areaStyle: {
              color: '#409eff',
              opacity: 0.3
            }
          }
        ]
      }

      myChart.setOption(option)

      // 监听窗口大小变化
      const resizeHandler = () => {
        myChart.resize()
      }

      uni.onWindowResize && uni.onWindowResize(resizeHandler)

      // 组件卸载时清理
      onUnmounted(() => {
        uni.offWindowResize && uni.offWindowResize(resizeHandler)
        myChart.dispose()
      })
    })
  } catch (error) {
    console.error('重试查询时出错:', error)
  }
}

// 在组件挂载时渲染图表
onMounted(() => {
  console.log('组件已挂载，开始渲染图表')
  renderChart()
})
</script>

<style scoped>
.line-chart-container {
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
  text-align: center;
}

.chart-canvas {
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  width: 100%;
  height: 400px;
}
</style>

