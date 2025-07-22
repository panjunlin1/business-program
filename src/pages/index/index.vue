<template xmlns="">
  <div class="home-container">
    <div class="uni-margin-wrap">
      <swiper class="swiper" circular :indicator-dots="indicatorDots" :autoplay="autoplay" :interval="interval"
              :duration="duration">
        <swiper-item>
          <image src="/static/icon/abc.jpg" mode="widthFix" class="swiper-image"></image>
        </swiper-item>
        <swiper-item>
          <image src="/static/icon/abc.jpg" mode="widthFix" class="swiper-image"></image>
        </swiper-item>
        <swiper-item>
          <image src="/static/icon/abc.jpg" mode="widthFix" class="swiper-image"></image>
        </swiper-item>
      </swiper>
    </div>

    <!-- 用户信息与登录区域 -->
    <div v-if="!userEntity" class="login-container">
      <text class="login-text">用户名</text>
      <button class="login-button" @click="handleButtonClick">登录</button>
    </div>
    <div v-else class="login-container">
      <text class="login-text">店铺名称: {{ userEntity.shopName }}</text>
      <text class="login-text">地址: {{ userEntity.address }}</text>
    </div>

    <!-- 四宫格功能按钮区域 -->
    <div class="grid-container">
      <!-- 修改四宫格按钮 -->
      <div
          class="grid-item"
          :class="{ 'active': activeButton === 'dineIn' }"
          @touchstart="handleTouchStart('dineIn')"
          @touchend="handleTouchEnd"
          @touchcancel="handleTouchCancel"
          @tap="navigateToDineIn"
      >
        <image src="../../static/icon/sj.png" mode="aspectFit"></image>
        <text class="grid-text">上架菜品</text>
      </div>

      <!-- 其他三个按钮类似 -->
      <div
          class="grid-item"
          :class="{ 'active': activeButton === 'recharge' }"
          @touchstart="handleTouchStart('recharge')"
          @touchend="handleTouchEnd"
          @touchcancel="handleTouchCancel"
          @tap="navigateToRecharge"
      >
        <image src="../../static/icon/sr.png" mode="aspectFit"></image>
        <text class="grid-text">收入</text>
      </div>

      <div
          class="grid-item"
          :class="{ 'active': activeButton === 'delivery' }"
          @touchstart="handleTouchStart('delivery')"
          @touchend="handleTouchEnd"
          @touchcancel="handleTouchCancel"
          @tap="navigateToDelivery"
      >
        <image src="../../static/icon/hy.png" mode="aspectFit"></image>
        <text class="grid-text">会员管理</text>
      </div>

      <div
          class="grid-item"
          :class="{ 'active': activeButton === 'material' }"
          @touchstart="handleTouchStart('material')"
          @touchend="handleTouchEnd"
          @touchcancel="handleTouchCancel"
          @tap="goToMaterialSelect"
      >
        <image src="../../static/icon/jh.png" mode="aspectFit"></image>
        <text class="grid-text">进货</text>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      background: ['color1', 'color2', 'color3'],
      indicatorDots: true,
      autoplay: true,
      interval: 2000,
      duration: 500
    }
  }
}
</script>

<script setup>
import { useRouter } from 'vue-router';
import { ref } from 'vue';
// 从 @dcloudio/uni-app 导入 onShow
import { onShow } from '@dcloudio/uni-app';

const router = useRouter();
const activeButton = ref(null);
const userEntity = ref(null);

// 触摸相关方法
const handleTouchStart = (buttonId) => {
  activeButton.value = buttonId;
};

const handleTouchEnd = () => {
  activeButton.value = null;
};

const handleTouchCancel = () => {
  activeButton.value = null;
};

// 登录按钮点击处理
const handleButtonClick = () => {
  uni.navigateTo({
    url: '/pages/index/login'
  });
};

// 页面显示时检查 userEntity
onShow(() => {
  try {
    const storedUserEntity = uni.getStorageSync('userEntity');
    if (storedUserEntity) {
      userEntity.value = storedUserEntity;
    }
  } catch (error) {
    console.error('读取 userEntity 数据失败:', error);
  }
});

// 页面跳转方法
const goToMaterialSelect = () => {
  uni.navigateTo({
    url: '/pages/MaterialSelect/MaterialSelect'
  });
};

const navigateToDineIn = () => {
  uni.navigateTo({
    url: '/pages/new_dishes/new_dishes'
  });
};

const navigateToDelivery = () => {
  uni.navigateTo({
    url: ''
  });
};

const navigateToRecharge = () => {
  uni.navigateTo({
    url: '/pages/income/income'
  });
};
</script>

<style>
.uni-margin-wrap {
  width: 100%;
  height: 100%;
}
.swiper {
  height: 550rpx;
}

.swiper-image {
  width: 100%;
  height: 100%;
}
</style>


<style scoped>
/* 登录 */
.login-container {
  width: 100%;
  height: 100rpx; /* 设置容器高度，便于定位 */
  display: flex;
  align-items: center;
  background-color: #fff;
  padding: 20rpx;
  margin-bottom: 20rpx;
  position: relative; /* 为子元素的绝对定位提供参考 */
}

.login-text {
  font-size: 28rpx;
  position: absolute; /* 绝对定位 */
  left: 25%; /* 右侧四分之一位置 */
  transform: translateX(50%); /* 微调，使其居中 */
}

.login-button {
  background-color: #4caf50;
  color: #fff;
  padding: 10rpx 20rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  position: absolute; /* 绝对定位 */
  right: 25%; /* 左侧四分之一位置 */
  transform: translateX(-50%); /* 微调，使其居中 */
}

/* 添加分隔线 */
.balance-item:not(:last-child) .balance-label::after {
  content: '';
  position: absolute;
  right: 0;
  top: 20%;
  height: 60%;
  width: 1rpx;
  background-color: #eee;
}


/* 四宫格样式 */
.grid-container {
  display: flex;
  flex-wrap: wrap;
  padding: 16rpx;
  background-color: #fff;
  border-radius: 12rpx;
  margin: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.grid-item {
  width: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 0;
  transition: all 0.1s;
}

/* 在<style scoped>中添加 */
.grid-item.active {
  transform: scale(0.95);
  opacity: 0.8;
  transition: all 0.1s;
}

.grid-item image {
  width: 80rpx;
  height: 80rpx;
  margin-bottom: 12rpx;
}

.grid-text {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 8rpx;
  font-weight: 500;
}

</style>