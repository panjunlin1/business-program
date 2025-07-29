<template>
  <div class="material-select-container">
    <!-- 材料列表区域（增加paddingBottom，避免被底部按钮遮挡） -->
    <scroll-view class="material-list" scroll-y>
      <div class="material-item" v-for="(item, index) in orders" :key="index">
        <image class="material-img" :src="item.img" mode="widthFix"></image>
        <div class="material-info">
          <div class="material-name">{{ item.materialName }}</div>
          <div class="material-price">价格：{{ item.materialPrice }}￥</div>
        </div>
        <div class="quantity-box">
          <button class="quantity-btn" @click="handleMinus(index)">-</button>
          <div class="quantity-text">{{ item.quantity }}</div>
          <button class="quantity-btn" @click="handlePlus(index)">+</button>
        </div>
      </div>
    </scroll-view>

    <!-- 底部固定按钮区域 -->
    <div class="bottom-btn-container">
      <button class="cancel-btn" @click="handleCancelAll">全部取消</button>
      <button class="confirm-btn" @click="handleConfirm">确定</button>
    </div>
  </div>
</template>

<script setup>
import {baseUrl} from "@/router";
import {onMounted, ref} from "vue";

const orders = ref([]);
const error = ref('');

onMounted(() => {
  // 发起请求
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
          orders.value = res.data.data.map(item => ({
            ...item,
            quantity: 0, // 为每个材料添加初始数量
            img: item.img // 设置默认图片
          }));
          console.log('物料加载成功:', orders.value);
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


// 数量减操作
const handleMinus = (index) => {
  if (orders.value[index].quantity > 0) {
    orders.value[index].quantity--;
  }
};

// 数量加操作
const handlePlus = (index) => {
  orders.value[index].quantity++;
};

// 全部取消：重置所有材料数量为0
const handleCancelAll = () => {
  orders.value.forEach(item => {
    item.quantity = 0;
  });
  // 可添加提示
  uni.showToast({
    title: '已全部取消',
    icon: 'none'
  });
};

// 确定：处理选中的材料
const handleConfirm = async () => {
  // 筛选出数量大于0的材料
  const selectedMaterials = orders.value.filter(item => item.quantity > 0);
  if (selectedMaterials.length === 0) {
    await uni.showToast({
      title: '请选择材料',
      icon: 'none'
    });
    return;
  }

  try {
    // 从本地存储获取商家ID
    const {data: merchantId} = await uni.getStorage({key: 'merchantId'});

    if (!merchantId) {
      await uni.showToast({title: '商家信息缺失，请重新登录', icon: 'none'});
      return;
    }

    // 确保每个选中的材料都包含quantity字段
    const materialsWithQuantity = selectedMaterials.map(material => ({
      ...material,
      quantity: material.quantity // 显式包含quantity字段
    }));

    // 合并商家ID与选中的材料数据
    const submitData = {
      merchantId,
      materials: materialsWithQuantity
    };

    console.log('提交的数据:', submitData); // 调试用，确认数据格式

    // 发送数据到后端
    const res = await uni.request({
      url: `${baseUrl}/mat/submit`,
      method: 'POST',
      data: submitData,
      header: {
        'Content-Type': 'application/json' // 确保设置正确的请求头
      }
    });

    console.log('响应数据:', res);

    if (res.statusCode === 200 && res.data.code === 0) {
      await uni.showToast({title: '提交成功', icon: 'success'});
    } else {
      await uni.showToast({
        title: res.data.msg || '提交失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('提交失败:', error);
    await uni.showToast({title: '网络错误', icon: 'none'});
  }
}
</script>

<style scoped>
/* 页面容器样式 */
.material-select-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #fff;
  /* 留出底部按钮高度的空间 */
  padding-bottom: 100rpx;
  box-sizing: border-box;
}

/* 材料列表滚动容器（增加底部内边距，避免最后一项被按钮遮挡） */
.material-list {
  flex: 1;
  padding: 10px;
}

/* 单个材料项样式 */
.material-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-bottom: 10px;
}

.material-img {
  width: 80px;
  height: 80px;
  margin-right: 10px;
}

.material-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.material-name {
  font-size: 15px;
  font-weight: bold;
  margin-bottom: 5px;
}

.material-price {
  font-size: 14px;
  color: #f44336;
}

/* 数量选择区域样式 */
.quantity-box {
  display: flex;
  align-items: center;
}

.quantity-btn {
  width: 36px;
  height: 36px;
  line-height: 36px; /* 与高度一致 */
  text-align: center;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin: 0 6px;
  font-size: 20px; /* 加大符号尺寸 */
  padding: 0; /* 清除默认内边距 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.quantity-text {
  width: 30px;
  text-align: center;
}

/* 底部固定按钮区域 */
.bottom-btn-container {
  position: fixed;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  padding: 20rpx;
  background-color: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05); /* 顶部阴影，区分内容区 */
  z-index: 99; /* 确保在列表上方 */
}

/* 全部取消按钮 */
.cancel-btn {
  width: 40%;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #f5f5f5;
  color: #333;
  border-radius: 8rpx;
  font-size: 28rpx;
}

/* 确定按钮 */
.confirm-btn {
  width: 40%;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #4caf50;
  color: #fff;
  border-radius: 8rpx;
  font-size: 28rpx;
}
</style>