<template>
  <view>
    <router-view></router-view>
    <uni-tabbar :list="tabBarList" @click="handleTabBarClick"></uni-tabbar>
  </view>
</template>

<script lang="ts">
export default {
  data() {
    return {
      tabBarList: [
        {
          pagePath: 'pages/index/index',
          text: '首页',
          iconPath:'static/icon/sy.png',
          selectedIconPath:'static/icon/sy1.png'
        },
        {
          pagePath: 'pages/order/order',
          text: '订单',
          iconPath:'static/icon/order.png',
          selectedIconPath:'static/icon/order1.png'
        },
        {
          pagePath: 'pages/my/my',
          text: '我的',
          iconPath:'static/icon/my.png',
          selectedIconPath:'static/icon/my1.png'
        }
      ]
    };
  },
  methods: {
    handleTabBarClick(e: any) {
      const { index } = e;
      const pagePath = this.tabBarList[index].pagePath;
      uni.switchTab({
        url: pagePath
      });
    }
  }
};
</script>

<style>
uni-tabbar {
  position: fixed;
  bottom: 0;
  width: 100%;
  background-color: white;
}
</style>