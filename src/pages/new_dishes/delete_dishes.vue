<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { baseUrl } from "@/router";

// 从本地缓存获取 userEntity
const getUserEntityFromStorage = () => {
  try {
    const userEntity = uni.getStorageSync('userEntity');
    return userEntity;
  } catch (error) {
    console.error('获取本地缓存 userEntity 失败:', error);
    return null;
  }
};

// 获取 shopId
const userEntity = getUserEntityFromStorage();
const shopId = ref(userEntity && userEntity.shop ? userEntity.shop.id : null);

// 添加数据源
const items = ref([
  // 可以继续添加更多项
])

const isLoading = ref(true);
const hasError = ref(false);

const fetchDishes = async () => {
  try {
    const queryParams = `?shopId=${shopId.value}`;
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

    console.log('接口返回数据:', response);

    if (Array.isArray(response.data)) {
      items.value = response.data.map((item: any) => ({
        ...item,
        dish_name: item.dishName,
      }));
    } else {
      console.error('响应数据中的 data 字段不是数组类型', response);
      hasError.value = true;
    }
  } catch (error) {
    console.error('获取菜品信息失败:', error);
    hasError.value = true;
  } finally {
    isLoading.value = false;
  }
};
// 在组件挂载时调用 fetchDishes 函数
onMounted(() => {
  fetchDishes();
});
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





const handleCancel = () => {
  // 取消操作后跳转并刷新页面
  uni.reLaunch({
    url: '/pages/new_dishes/new_dishes' // 替换为实际跳转的页面路径
  });
};

// 封装 uni.request 为 Promise 函数
const uniRequest = (options: UniApp.RequestOptions) => {
  return new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
    uni.request({
      ...options,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res);
        } else {
          reject(new Error(`请求失败，状态码：${res.statusCode}，响应信息：${res.data}`));
        }
      },
      fail: (err) => {
        reject(new Error(`请求失败，错误信息：${err.errMsg}`));
      }
    });
  });
};

const handleDelete = async () => {
  try {
    // 获取选中的 dishesId
    const selectedDishesId = selectedItems.value;
    if (selectedDishesId === null) {
      console.error('请选择一个菜品');
      uni.showToast({
        icon: "none",
        title: "请选择一个菜品"
      });
      return;
    }

    const requestData = {
      shopId: shopId.value,
      dishesIds: selectedDishesId // 传递单个 Integer 类型
    };

    console.log('发送到后端的删除数据:', requestData);

    // 发送删除请求到后端
    const res = await uniRequest({
      url: baseUrl + '/shop/deleteShopDishes', // 使用删除接口
      method: 'POST',
      data: requestData
    });

    console.log('删除成功:', res.data);

    // 删除成功后，重新获取菜品列表
    await fetchDishes();

    uni.showToast({
      icon: "success",
      title: "删除成功"
    });
  } catch (error) {
    console.error('删除失败:', error);
    uni.showToast({
      icon: "none",
      title: error instanceof Error ? error.message : "删除失败，请重试"
    });
  }
};
</script>

<template>
  <view>
    <view v-if="isLoading">加载中...</view>
    <view v-else-if="hasError">加载失败，请重试</view>
    <view v-else class="uni-padding-wrap uni-common-mt">
      <view class="head">
        <text>请选择你要删除的菜品</text>
        <button class="Delete_dishes" type="warn" size="mini" @click="handleDelete">删除</button>
        <button class="Cancel_dishes" type="default" size="mini" @click="handleCancel">取消</button>
      </view>
      <view class="uni-scroll-view">
        <scroll-view :scroll-top="scrollTop" scroll-y="true" class="scroll-Y" @scrolltoupper="upper"
                     @scrolltolower="lower" @scroll="scroll">
          <!-- 使用 v-for 循环渲染视图 -->
          <view v-for="item in items" :key="item.id" class="dish-box" >
            <view class="dish-item">
              <image :src="item.image" mode="aspectFit" class="dish-image"></image>
              <view class="dish-info">
                <view class="info-row">
                  <text class="label">菜品名称：</text>
                  <!-- 使用转换后的字段名 -->
                  <text class="value">{{ item.dish_name }}</text>
                </view>
                <view class="info-row">
                  <text class="label">价格：</text>
                  <text class="value">¥{{ item.price }}</text>
                </view>
                <view class="info-row">
                  <text class="label">分类：</text>
                  <text class="value">{{ item.typeId }}</text>
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

.Cancel_dishes {
  background-color: #CCCCCC;
  float: right;
  margin-right: 10px;
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

.Cancel_dishes {
  background-color: #CCCCCC;
  float: right;
  margin-right: 10px;
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