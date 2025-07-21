<template>
  <div class="merchant-container">

    <!-- 核心信息区 -->
    <div class="card-container">
      <div class="info-card">
        <!-- 头像 + 店名 + ID 区域 -->
        <div class="profile-section">
          <image class="avatar" :src="avatarUrl"></image>
          <div class="text-group">
            <text class="shop-name">{{ shopName }}</text>
            <text class="shop-id">{{ shopId }}</text>
          </div>
        </div>

        <!-- 修改按钮（右上角） -->
        <button class="edit-btn" @click="handleEdit">修改</button>

        <!-- 商家信息 -->
        <div class="bottom-section">
          <text>商家地址：{{ merchantAddress }}</text>
          <text>商家联系方式：{{ merchantContact }}</text>
          <text>店的开业时间：{{ openingTime }}</text>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';

// 模拟数据
const avatarUrl = ref('https://example.com/avatar.png'); // 头像地址
const shopName = ref('示例店名');
const shopId = ref('店的 ID 编码：SHOP123456');
const merchantAddress = ref('示例街道 123 号');
const merchantContact = ref('13800138000');
const openingTime = ref('2020-01-01');

// 修改按钮点击事件
const handleEdit = () => {
  uni.navigateTo({ url: '/pages/merchant-edit/merchant-edit' });
};
</script>

<style scoped>
/* 页面容器 */
.merchant-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background-color: #fff;
}

/* 顶部标题栏 */
.menu text {
  font-size: 20px;
  color: #999;
}

/* 核心信息区 */
.card-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  width: 100%;
  padding: 0 16px;
  box-sizing: border-box;
}
.info-card {
  position: relative;
  width: 100%;
  max-width: 500px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  box-sizing: border-box;
}

/* 头像 + 店名 + ID 区域 */
.profile-section {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-right: 12px;
}
.text-group {
  display: flex;
  flex-direction: column;
}
.shop-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}
.shop-id {
  font-size: 14px;
  color: #666;
}

/* 修改按钮（右上角） */
.edit-btn {
  height: 40px;
  width: 60px;
  position: absolute;
  top: 0;
  right: 0;
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 14px;
}

/* 商家信息区域 */
.bottom-section {
  border-top: 1px solid #eee;
  padding-top: 12px;
}
.bottom-section text {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 6px;
  line-height: 1.6;
}

.tab-item text {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}
.active text {
  color: #ff5722; /* 选中态颜色 */
}
</style>