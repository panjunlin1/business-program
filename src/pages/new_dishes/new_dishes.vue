<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { baseUrl } from "@/router";

// 从本地缓存获取 userEntity
const getUserEntityFromStorage = () => {
  try {
    return uni.getStorageSync('userEntity');
  } catch (error) {
    console.error('获取本地缓存 userEntity 失败:', error);
    return null;
  }
};

// 获取 shopId
const userEntity = getUserEntityFromStorage();
const shopId = ref(userEntity && userEntity.shop ? userEntity.shop.id : null);

// 添加数据源
const items = ref<any[]>([]);

const fetchDishes = async () => {
  try {
    // 构建包含 shopId 的查询参数
    const queryParams = `?shopId=${shopId.value}`;
    // 拼接完整的请求 url
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

    console.log(response);

    // 检查 response.data 是否为数组
    if (Array.isArray(response.data)) {
      // 对 response.data 调用 map 方法，添加 status 字段
      items.value = response.data.map((item: any) => ({
        ...item,
        dish_name: item.dishName, // 将 dishName 转换为 dish_name
        status: item.shopDishesIsAvailable === 1 ? '已上架' : '已下架' // 根据 shopDishesIsAvailable 判断状态
      }));
    } else {
      console.error('响应数据中的 data 字段不是数组类型', response);
    }
  } catch (error) {
    console.error('获取菜品信息失败:', error);
  }
};

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
const navigateToAddDishes = () => {
  uni.navigateTo({
    url: '/pages/new_dishes/add_dishes'  // 跳转到add_dishes页面
  });
}
const navigateToDeleteDishes = () => {
  uni.navigateTo({
    url: '/pages/new_dishes/delete_dishes'  // 跳转到delete_dishes页面
  });
}

// 封装请求函数
const updateDishStatus = async (dishId: number, isAvailable: number) => {
  if (!shopId.value) {
    console.error('shopId 为空，无法更新菜品状态');
    uni.showToast({
      icon: 'none',
      title: '获取店铺信息失败，无法更新菜品状态'
    });
    return;
  }
  try {
    // 手动拼接查询字符串
    const queryParams = `shopId=${Number(shopId.value)}&dishId=${Number(dishId)}&isAvailable=${Number(isAvailable)}`;
    const url = `${baseUrl}/shop/updateIsAvailable?${queryParams}`;

    const response = await new Promise((resolve, reject) => {
      uni.request({
        url,
        method: 'POST',
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
    return response;
  } catch (error) {
    console.error('更新菜品状态失败:', error);
    throw error;
  }
};

const onShelf = async (id: number) => {
  try {
    await updateDishStatus(id, 1);
    const item = items.value.find(i => i.id === id);
    if (item) {
      item.status = '已上架';
      item.shopDishesIsAvailable = 1; // 更新本地数据的 shopDishesIsAvailable 字段
    }
    uni.showToast({
      title: '菜品已上架',
      icon: 'success'
    });
  } catch (error) {
    uni.showToast({
      title: '上架失败，请重试',
      icon: 'none'
    });
  }
};

const offShelf = async (id: number) => {
  try {
    await updateDishStatus(id, 0);
    const item = items.value.find(i => i.id === id);
    if (item) {
      item.status = '已下架';
      item.shopDishesIsAvailable = 0; // 更新本地数据的 shopDishesIsAvailable 字段
    }
    uni.showToast({
      title: '菜品已下架',
      icon: 'success'
    });
  } catch (error) {
    uni.showToast({
      title: '下架失败，请重试',
      icon: 'none'
    });
  }
};

// 在组件挂载后调用 fetchDishes 函数
onMounted(() => {
  fetchDishes();
});
</script>

<template>
  <view>
    <view class="uni-padding-wrap uni-common-mt">
      <view class="head">
        <button class="Add_dishes" type="primary" size="mini" @click="navigateToAddDishes">添加菜品</button>
        <button class="Delete_dishes" type="warn" size="mini" @click="navigateToDeleteDishes">删除菜品</button>
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
                <button class="action-btn on-shelf" size="mini" @click.stop="onShelf(item.id)">
                  {{ item.status === '已上架' ? '已上架' : '上架' }}
                </button>
                <button class="action-btn off-shelf" size="mini" @click.stop="offShelf(item.id)">
                  {{ item.status === '已下架' ? '已下架' : '下架' }}
                </button>
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
  /* 移除原来的 margin-left: 10px */
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