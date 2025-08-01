<template>
  <button class="pay-btn" @tap="onPayClick">微信支付</button>
</template>

<script setup>

const onPayClick = () => {
  const userInfo = wx.getStorageSync('userinfo')
  if (!userInfo || !userInfo.openid) {
    wx.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  wx.request({
    url: 'https://qb111pq526416.vicp.fun/api/pay/create', // ← 替换成你的后端接口地址
    method: 'POST',
    data: {
      openid: userInfo.openid,
      total: 1,
      description: '菜品材料'
    },
    success(res) {
      const payData = res.data.data
      console.log("payData:"+payData)
      wx.requestPayment({
        timeStamp: payData.timeStamp,
        nonceStr: payData.nonceStr,
        package: payData.package,
        signType: payData.signType,
        paySign: payData.paySign,
        success() {
          wx.showToast({ title: '支付成功' })
          // 支付成功后的逻辑：比如跳转页面、刷新订单状态等
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
</script>

<style scoped>
.pay-btn {
  background-color: #409e3a;
  color: white;
  padding: 20rpx;
  border-radius: 20rpx;
  font-size: 30rpx;
  width: 60%;
  margin: 20rpx auto;
}
</style>
