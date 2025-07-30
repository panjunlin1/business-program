<template>
  <div class="my-page">
    <view class="user-header">
      <text class="page-title">用户信息</text>
    </view>

    <view class="user-content" v-if="userEntity">
      <view class="info-card">
        <view class="info-item">
          <text class="info-label">店铺名称:</text>
          <text class="info-value">{{ userEntity.shop.shopName }}</text>
        </view>

        <view class="info-item">
          <text class="info-label">地址:</text>
          <text class="info-value">{{ userEntity.shop.address }}</text>
        </view>

        <view class="info-item">
          <text class="info-label">手机号:</text>
          <text class="info-value">{{ userEntity.shop.phone }}</text>
        </view>

        <view class="info-item">
          <text class="info-label">创建时间:</text>
          <text class="info-value">{{ formatDate(userEntity.shop.createTime) }}</text>
        </view>

        <view class="info-item status-item">
          <text class="info-label">激活状态:</text>
          <text :class="['info-value', 'status', userEntity.shop.isActive === 1 ? 'active' : 'inactive']">
            {{ userEntity.shop.isActive === 1 ? '已激活' : '未激活' }}
          </text>
        </view>
      </view>

      <view class="action-buttons">
        <button class="action-btn logout-btn" @click="handleLogout">退出登录</button>
      </view>
    </view>

    <view class="empty-state" v-else>
      <text class="empty-text">暂无用户信息</text>
    </view>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow, onLoad } from '@dcloudio/uni-app';

interface Shop {
  shopName: string;
  address: string;
  phone: string;
  createTime: string;
  isActive: number;
}

interface UserEntity {
  shop: Shop;
}

const userEntity = ref<UserEntity | null>(null);

// 格式化日期显示
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? dateString : date.toLocaleString();
};

// 退出登录
const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: function (res) {
      if (res.confirm) {
        try {
          uni.removeStorageSync('userEntity');
          userEntity.value = null;
          uni.redirectTo({
            url: '/pages/index/login'
          });
        } catch (error) {
          console.error('退出登录失败:', error);
          uni.showToast({
            title: '退出失败',
            icon: 'none'
          });
        }
      }
    }
  });
};

// 页面加载时读取数据
onLoad(() => {
  try {
    const storedUserEntity = uni.getStorageSync('userEntity');
    if (storedUserEntity) {
      userEntity.value = storedUserEntity;
    }
  } catch (error) {
    console.error('读取 userEntity 数据失败:', error);
    uni.showToast({
      title: '数据加载失败',
      icon: 'none'
    });
  }
});

// 页面显示时重新读取数据
onShow(() => {
  try {
    const storedUserEntity = uni.getStorageSync('userEntity');
    if (storedUserEntity) {
      userEntity.value = storedUserEntity;
    }
  } catch (error) {
    console.error('重新读取 userEntity 数据失败:', error);
    uni.showToast({
      title: '数据刷新失败',
      icon: 'none'
    });
  }
});
</script>

<style scoped>
.my-page {
  padding: 20px;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.user-header {
  text-align: center;
  margin-bottom: 30px;
  padding-top: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.info-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

.info-value {
  font-size: 16px;
  color: #333;
  text-align: right;
  flex: 1;
  margin-left: 20px;
  word-break: break-all;
}

.status {
  font-weight: bold;
}

.status.active {
  color: #4cd964;
}

.status.inactive {
  color: #f0ad4e;
}

.action-buttons {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

.action-btn {
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
}

.logout-btn {
  background-color: #007aff;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 50px 20px;
}

.empty-text {
  font-size: 16px;
  color: #999;
}
</style>