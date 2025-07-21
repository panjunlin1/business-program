<script setup lang="ts">
// 修改为自动导入方式（easycom已配置）
// 无需手动导入，直接使用 <uni-fab> 标签即可
import {ref, nextTick} from 'vue'

// 添加数据源
const items = ref([
  {
    id: 45556,
    dish_name: '桂林米粉',
    price: 10,
    image_url: "https://ts1.tc.mm.bing.net/th/id/OIP-C.bfDWFKlpBIajsYJr7v-XngHaE7?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
    category: "招牌菜品"
  },
  {
    id: 45557,
    dish_name: '桂林4米粉',
    price: 10,
    image_url: "https://ts1.tc.mm.bing.net/th/id/OIP-C.bfDWFKlpBIajsYJr7v-XngHaE7?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
    category: "招牌菜品"
  },

  // 可以继续添加更多项
])

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

const handleSave = () => {
  console.log('选中的菜品ID:', selectedItems.value);
  // 这里可以添加导航回上一页或其他逻辑
  uni.navigateBack();
};

const handleCancel = () => {
  uni.navigateBack();
};

</script>

<template>
  <view>
    <view class="uni-padding-wrap uni-common-mt">
      <view class="head">
        <text>请选择你要新增的菜品</text>
        <button class="Add_dishes" type="primary" size="mini" @click="handleSave">保存</button>
        <button class="Delete_dishes" type="warn" size="mini" @click="handleCancel">取消</button>
      </view>
      <view class="uni-scroll-view">
        <scroll-view :scroll-top="scrollTop" scroll-y="true" class="scroll-Y" @scrolltoupper="upper"
                     @scrolltolower="lower" @scroll="scroll">
          <!-- 使用 v-for 循环渲染视图 -->
          <view v-for="item in items" :key="item.id" class="dish-box" >
            <view class="dish-item">
              <image :src="item.image_url" mode="aspectFit" class="dish-image"></image>
              <view class="dish-info">
                <view class="info-row">
                  <text class="label">菜品名称：</text>
                  <text class="value">{{ item.dish_name }}</text>
                </view>
                <view class="info-row">
                  <text class="label">价格：</text>
                  <text class="value">¥{{ item.price }}</text>
                </view>
                <view class="info-row">
                  <text class="label">分类：</text>
                  <text class="value">{{ item.category }}</text>
                </view>
              </view>
              <view class="dish-actions">
                <checkbox-group @change="() => toggleSelection(item.id)">
                  <label>
                    <checkbox :value="item.id" :checked="selectedItems.includes(item.id)" />
                  </label>
                </checkbox-group>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
      <view @tap="goTop" class="uni-link uni-center uni-common-mt">
        点击这里返回顶部
      </view>
    </view>

  </view>
</template>

<style scoped>
.scroll-Y {
  height: 100vh; /* 使用视口高度单位 */
}

.scroll-view-item {
  height: 150px;
  line-height: 300rpx;
  text-align: center;
  font-size: 36rpx;
}

/* 确保外层容器也填满屏幕 */
.uni-scroll-view {
  height: 100%;
}

.head {
  height: 100rpx;
  line-height: 100rpx;
  text-align: center;
  font-size: 36rpx;
}

.scroll-view-item {
  border: 1px solid #ccc; /* 添加1像素灰色实线边框 */
  border-radius: 8rpx; /* 添加8rpx的圆角 */
  margin: 10rpx 0; /* 添加上下边距 */
}

.Add_dishes {
  background-color: #007AFF;
  float: right;
}

.Delete_dishes {
  background-color: #FF0000;
  float: right;
}

.dish-box {
  display: flex;
  height: 120px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin: 10px 0;
  padding: 10px;
  background-color: #fff;
}

.dish-item {
  display: flex;
  width: 100%;
  align-items: center; /* 垂直居中 */
  justify-content: space-between; /* 添加这行使内容分散对齐 */
}

.dish-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;

}

.action-btn {
  margin: 5px 0;
  padding: 0 10px;
  height: 30px;
  line-height: 30px;
}

.on-shelf {
  background-color: #4CAF50;
  color: white;
}

.off-shelf {
  background-color: #F44336;
  color: white;
}
.dish-image {
  width: 100px;
  height: 100px;
  border-radius: 6px;
  margin-right: 15px;
}
</style>