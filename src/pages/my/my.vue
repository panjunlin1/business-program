<template>
  <div class="my-page">
    <h1 class="page-title">用户信息</h1>
    <div v-if="userEntity">
      <p>店铺名称: {{ userEntity.shopName }}</p>
      <p>地址: {{ userEntity.address }}</p>
      <p>手机号: {{ userEntity.phone }}</p>
      <p>创建时间: {{ userEntity.createTime }}</p>
      <p>激活状态: {{ userEntity.isActive === 0 ? '未激活' : '已激活' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
// 从 @dcloudio/uni-app 导入 onShow 和 onLoad
import { onShow, onLoad } from '@dcloudio/uni-app';

const userEntity = ref(null);

// 页面加载时读取数据
onLoad(() => {
  try {
    const storedUserEntity = uni.getStorageSync('userEntity');
    if (storedUserEntity) {
      userEntity.value = storedUserEntity;
    }
  } catch (error) {
    console.error('读取 userEntity 数据失败:', error);
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
  }
});
</script>

<style scoped>
.my-page {
  padding: 20px;
}
/* 使用 class 选择器替换 h1 标签选择器 */
.page-title {
  text-align: center;
  color: #333;
}
.my-page p {
  font-size: 16px;
  color: #666;
  margin-bottom: 10px;
}
</style>