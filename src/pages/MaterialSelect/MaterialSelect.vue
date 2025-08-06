<template>
  <view class="page-container">
    <!-- 左侧固定导航栏 -->
    <view class="sidebar">
      <view class="sidebar-header">
        <image class="home-icon" src="" @click="goHome"></image>
        <text class="sidebar-title">好食材在云海肴</text>
      </view>
      <view
          class="sidebar-item"
          v-for="(item, index) in sidebarMenus"
          :key="index"
          :class="{ active: currentTab === index }"
          @click="currentTab = index"
      >
        <text class="sidebar-item-text">{{ item.title }}</text>
      </view>
    </view>

    <!-- 右侧内容区 -->
    <view class="main-content">
      <view class="top-bar">
        <text class="top-title">{{ sidebarMenus[currentTab].title }}</text>
      </view>

      <view class="material-list">
        <view
            class="material-item"
            v-for="(item, index) in sidebarMenus[currentTab].materials"
            :key="index"
        >
          <image
              class="material-img"
              src="/static/icon/abc.jpg"
              mode="aspectFill"
          ></image>
          <view class="material-info">
            <text class="material-name">{{ item.materialName }}</text>
            <text class="material-price">{{ item.materialPrice }}¥</text>
          </view>
          <view class="quantity-box">
            <button
                class="quantity-btn"
                @click="handleMinus(currentTab, index)"
                v-if="item.quantity > 0"
            >-</button>
            <input
                type="number"
                class="quantity-input"
                :value="item.quantity"
                @input="handleInput(currentTab, index, $event)"
                v-if="item.quantity > 0"
            />
            <button
                class="quantity-btn"
                @click="handlePlus(currentTab, index)"
            >+</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部购物车栏 -->
    <view class="bottom-cart-bar" @click="toggleCart">
      <view class="cart-info">
        <text class="cart-text">我的购物车</text>
        <view class="cart-count" v-if="selectedMaterials.length > 0">
          {{ selectedMaterials.reduce((total, item) => total + item.quantity, 0) }}
        </view>
      </view>
      <view class="cart-total">
        <text>合计：¥{{ totalPrice.toFixed(2) }}</text>
        <button class="pay-btn" @click="handlePay" :disabled="selectedMaterials.length === 0">
          去支付
        </button>
      </view>
    </view>

    <!-- 购物车弹窗 -->
    <view class="cart-popup" v-show="showCart">
      <view class="cart-popup-mask" @click="toggleCart"></view>
      <view class="cart-popup-content">
        <view class="cart-popup-header">
          <text class="cart-popup-title">我的购物车</text>
          <image class="close-icon" src="/static/icon/abc.jpg" @click="toggleCart"></image>
        </view>
        <view class="cart-items">
          <view class="cart-item"
                v-for="(item, index) in selectedMaterials"
                :key="index">
            <!-- 左侧商品信息 -->
            <view class="cart-item-left">
              <text class="cart-item-name">{{ item.materialName }}</text>
              <text class="cart-item-desc">¥{{ item.materialPrice }} × {{ item.quantity }}</text>
            </view>
            <!-- 中间偏右数量操作 -->
            <view class="cart-item-middle">
            <view class="quantity-box">
              <button class="quantity-btn" @click="handleCartMinus(index)">-</button>
              <input
                  type="number"
                  class="quantity-input"
                  :value="item.quantity"
                  @input="handleCartInput(index, $event)"
              />
              <button class="quantity-btn" @click="handleCartPlus(index)">+</button>
            </view>
          </view>
            <!-- 最右边价格 -->
            <text class="cart-item-total">¥{{ (item.materialPrice * item.quantity).toFixed(2) }}</text>
          </view>
          <view class="cart-empty" v-if="selectedMaterials.length === 0">
            购物车为空，请选择商品~
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { baseUrl } from '@/router';

// 左侧导航菜单及对应食材数据
const sidebarMenus = ref([
  { title: '肉类', materials: [] },
  { title: '蔬菜', materials: [] },
  { title: '海鲜', materials: [] },
  { title: '调料', materials: [] },
  { title: '粉类', materials: [] },
  { title: '主食', materials: [] },
  { title: '其它', materials: [] },
]);

// 分类映射表
const categoryMap = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7
};

const currentTab = ref(0);
const showCart = ref(false);
const error = ref('');

onMounted(() => {
  // 发起请求获取食材数据
  uni.request({
    url: `${baseUrl}/mat/material`,
    method: 'GET',
    header: {
      'Content-Type': 'application/json'
    },
    success: (res) => {
      if (res.statusCode === 200) {
        if (res.data.code === 200 && res.data.data) {
          // 初始化数据，添加 quantity 字段
          const materials = res.data.data.map(item => ({
            ...item,
            quantity: 0,
            img: item.img || '',
          }));

          // 将接口数据按分类填充到 sidebarMenus
          materials.forEach(material => {
            console.log(material.status)
            const categoryIndex = categoryMap[material.status] || 0;
            if (sidebarMenus.value[categoryIndex]) {
              sidebarMenus.value[categoryIndex].materials.push(material);
            } else {
              sidebarMenus.value[0].materials.push(material);
            }
          });

          console.log('物料加载成功:', sidebarMenus.value);
        } else {
          error.value = res.data.msg || '获取物料失败';
          console.error('物料接口返回错误:', res.data);
        }
      } else {
        error.value = `HTTP 错误: ${res.statusCode}`;
        console.error('HTTP 请求失败:', res);
      }
    },
    fail: (err) => {
      error.value = '网络请求失败';
      console.error('请求失败:', err);
    }
  });
});

// 购物车相关计算属性
const selectedMaterials = computed(() => {
  let allSelected = [];
  sidebarMenus.value.forEach(menu => {
    menu.materials.forEach(material => {
      if (material.quantity > 0) {
        allSelected.push(material);
      }
    });
  });
  return allSelected;
});

const totalPrice = computed(() => {
  return selectedMaterials.value.reduce((sum, item) => sum + item.materialPrice * item.quantity, 0);
});

// 数量操作方法
const handleMinus = (menuIndex, materialIndex) => {
  const material = sidebarMenus.value[menuIndex].materials[materialIndex];
  if (material.quantity > 0) {
    material.quantity--;
  }
};

const handlePlus = (menuIndex, materialIndex) => {
  const material = sidebarMenus.value[menuIndex].materials[materialIndex];
  material.quantity++;
};

const handleInput = (menuIndex, materialIndex, e) => {
  const value = parseInt(e.detail.value);
  const material = sidebarMenus.value[menuIndex].materials[materialIndex];
  if (!isNaN(value) && value >= 0) {
    material.quantity = value;
  } else {
    material.quantity = 0;
  }
};

// 购物车弹窗内的数量操作方法
const handleCartMinus = (index) => {
  const item = selectedMaterials.value[index];
  if (item.quantity > 0) {
    item.quantity--;
  }
};

const handleCartPlus = (index) => {
  const item = selectedMaterials.value[index];
  item.quantity++;
};

const handleCartInput = (index, e) => {
  const value = parseInt(e.detail.value);
  const item = selectedMaterials.value[index];
  if (!isNaN(value) && value >= 0) {
    item.quantity = value;
  } else {
    item.quantity = 0;
  }
};

// 切换购物车显示
const toggleCart = () => {
  showCart.value = !showCart.value;
};

// 支付逻辑（核心修改部分）
const handlePay = async () => {
  if (selectedMaterials.value.length === 0) {
    await uni.showToast({title: '购物车为空', icon: 'none'});
    return;
  }

  try {
    // 1. 从本地存储获取商家ID
    const { data: merchantId } = await uni.getStorage({ key: 'merchantId' });

    if (!merchantId) {
      await uni.showToast({ title: '商家信息缺失，请重新登录', icon: 'none' });
      return;
    }

    // 2. 构造包含商家ID和购物车数据的提交格式
    const submitData = {
      merchantId: merchantId,
      totalPrice: totalPrice.value,
      currentTime: new Date().toLocaleString('zh', { hour12: false }).replaceAll('/', '-'),
      materials: selectedMaterials.value.map(item => ({
        id: item.id,
        materialName: item.materialName,
        materialPrice: item.materialPrice,
        quantity: item.quantity
      }))
    };

    console.log('提交给后端的数据:', submitData);

    // 3. 显示支付确认弹窗
    uni.showModal({
      title: '支付确认',
      content: `需支付 ¥${totalPrice.value.toFixed(2)} ，是否继续？`,
      success: async (res) => {
        if (res.confirm) {
          const userInfo = wx.getStorageSync('userinfo')
          if (!userInfo || !userInfo.openid) {
            wx.showToast({ title: '请先登录', icon: 'none' })
            return
          }

          wx.request({
            url: 'https://pjl.juntaitec.cn/api/pay/create', // ← 替换成你的后端接口地址
            method: 'POST',
            data: {
              openid: userInfo.openid,
              total: totalPrice.value.toFixed(2),
              description: '菜品材料'
            },
            success(res) {
              const payData = res.data.data
              console.log("payData:",payData)
              wx.requestPayment({
                timeStamp: payData.timeStamp,
                nonceStr: payData.nonceStr,
                package: payData.package,
                signType: payData.signType,
                paySign: payData.paySign,
                async success() {
                  wx.showToast({title: '支付成功'})
                  // 4. 发送数据到后端
                  const payRes = await uni.request({
                    url: `${baseUrl}/mat/submit`,
                    method: 'POST',
                    data: submitData,
                    header: {
                      'Content-Type': 'application/json'
                    }
                  });
                  console.log('后端支付响应:', payRes);
                },
                fail() {
                  wx.showToast({ title: '支付失败', icon: 'none' })
                  console.error("支付失败", res)
                }
              })
              console.log(payData) // 检查 timeStamp, nonceStr, package, paySign 是否齐全
            },
            fail(err) {
              console.error('发起支付失败', err)
              wx.showToast({ title: '支付请求失败', icon: 'none' })
            }
          })
        }
      }
    });
  } catch (err) {
    console.error('支付过程出错:', err);
    await uni.showToast({title: '网络错误，请重试', icon: 'none'});
  }
};

// 回到首页
const goHome = () => {
  uni.navigateBack({ delta: 1 });
};
</script>

<style scoped>
/* 样式部分保持不变 */
/* 页面容器 */
.page-container {
  display: flex;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
}

/* 左侧固定导航栏 */
.sidebar {
  width: 200rpx;
  background-color: #fff;
  box-shadow: 2rpx 0 10rpx rgba(0, 0, 0, 0.05);
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
}
.sidebar-header {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1px solid #eee;
}
.home-icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 10rpx;
}
.sidebar-title {
  font-size: 32rpx;
  font-weight: bold;
}
.sidebar-item {
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  font-size: 28rpx;
  border-bottom: 1px solid #eee;
}
.sidebar-item.active {
  background-color: #fafafa;
  color: #4caf50;
  font-weight: bold;
}

/* 右侧内容区 */
.main-content {
  flex: 1;
  margin-left: 200rpx;
  box-sizing: border-box;
  padding-bottom: 20rpx;
}

.top-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.top-title {
  padding-top: 8px;
  padding-left: 47%;
  font-size: 36rpx;
  font-weight: bold;
  color: black;
}

/* 材料列表 */
.material-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.material-item {
  display: flex;
  align-items: center;
  background-color: #fff;
  padding: 20rpx;
  border-radius: 10rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.03);
  justify-content: space-between;
}
.material-img {
  width: 160rpx;
  height: 160rpx;
  border-radius: 10rpx;
  margin-right: 20rpx;
}
.material-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.material-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.material-price {
  font-size: 30rpx;
  color: #f44336;
  font-weight: bold;
}

/* 底部购物车栏 */
.bottom-cart-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background-color: #fff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20rpx;
  /* 关键：设置高 z-index ，让底部栏始终在最上层 */
  z-index: 1000;
}

.cart-info {
  display: flex;
  align-items: center;
}
.cart-text {
  font-size: 30rpx;
  color: #333;
  margin-right: 10rpx;
}
.cart-count {
  background-color: #f44336;
  color: #fff;
  font-size: 24rpx;
  padding: 4rpx 8rpx;
  border-radius: 50%;
  line-height: 1;
}
.cart-total {
  display: flex;
  align-items: center;
}
.cart-total text {
  font-size: 28rpx;
  color: #333;
  margin-right: 20rpx;
}
.pay-btn {
  background-color: #4caf50;
  color: #fff;
  font-size: 28rpx;
  padding: 15rpx 30rpx;
  border-radius: 8rpx;
  border: none;
}
.pay-btn:disabled {
  background-color: #ccc;
  color: #fff;
}

/* 购物车弹窗 */
.cart-popup {
  position: fixed;
  /* 调整 bottom ，让弹窗在底部栏上方（假设底部栏高 100rpx ） */
  bottom: 100rpx;
  left: 0;
  right: 0;
  /* 弹窗层级低于底部栏，这样底部栏不会被覆盖 */
  z-index: 999;
}
.cart-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  /* 同样，遮罩也不覆盖底部栏 */
  bottom: 100rpx;
  background-color: rgba(0, 0, 0, 0.3);
  /* 让遮罩可点击关闭弹窗 */
  pointer-events: auto;
}
.cart-popup-content {
  position: relative;
  background-color: #fff;
  border-top-left-radius: 30rpx;
  border-top-right-radius: 30rpx;
  padding: 20rpx;
  animation: slide-up 0.3s ease;
  max-height: 40vh;
  /* 内容区域可滚动，且层级继承父级（低于底部栏） */
  overflow-y: auto;
}
.cart-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}
.cart-popup-title {
  font-size: 32rpx;
  font-weight: bold;
}
.close-icon {
  width: 40rpx;
  height: 40rpx;
}
.cart-items {
  max-height: unset;
  overflow-y: auto;
}

.cart-item {
  display: flex;
  /* 关键：让三个区域自动分配空间，左侧固定，中间挤到右侧，右侧价格固定 */
  justify-content: space-between;
  align-items: center;
  padding: 15rpx 0;
  border-bottom: 1px solid #f5f5f5;
}

.cart-item-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}
.cart-item-desc {
  font-size: 26rpx;
  color: #666;
}

.cart-empty {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 28rpx;
}

/* 左侧商品信息：固定宽度，确保数量操作区域位置稳定 */
.cart-item-left {
  width: 35%; /* 占父容器 35% ，可调整 */
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.cart-item-middle {
  flex: 0 0 40%; /* 固定宽度，占父容器 40% 左右 */
  margin-left: auto; /* 关键：让中间区域“挤”到右侧，形成“四分之三位置”视觉效果 */
  display: flex;
  justify-content: flex-end; /* 让按钮靠右，和价格区域对齐 */
}

.quantity-box {
  display: flex;
  align-items: center;
}

.quantity-btn {
  /* 按钮基础样式 */
  width: 60rpx;
  height: 60rpx;
  line-height: 60rpx;
  text-align: center;
  border: 1px solid #dcdcdc; /* 浅灰色边框 */
  border-radius: 12rpx; /* 更大圆角，更柔和 */
  margin: 0 10rpx;
  font-size: 36rpx;
  padding: 0;
  background-color: #f8f8f8; /* 浅灰色背景 */
  color: #333; /* 文字颜色 */
  /* 点击反馈 */
  transition: all 0.2s ease;
}

/* 按钮点击态 */
.quantity-btn:active {
  background-color: #eaeaea;
  transform: scale(0.95);
}
.quantity-input {
  width: 60rpx;
  text-align: center;
  font-size: 28rpx;
  border: 1px solid #ccc;
  border-radius: 6rpx;
}
.cart-item-total {
  width: 25%; /* 占父容器 25% ，可调整 */
  text-align: right;
  font-size: 30rpx;
  color: #f44336;
  font-weight: bold;
}

/* 购物车弹窗动画 */
@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>




