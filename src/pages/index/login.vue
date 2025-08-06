<template>
  <div class="login-container">
    <!-- 登录弹窗 -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <button class="close-btn" @click="hideModal">×</button>
        <div class="modal-body">
          <h2>一键登录</h2>
          <button class="phone-btn" open-type="getPhoneNumber" @getphonenumber="getPhoneNumber">
            <img src="https://icons8.com/icon/38283/wechat" alt="微信图标" class="wechat-icon"/>
            一键获取手机号
          </button>
        </div>
      </div>
    </div>

    <!-- 用户信息展示 -->
    <div v-if="userEntity" class="user-info">
      <img :src="userInfo.avatarUrl" alt="用户头像" class="avatar">
      <p class="nickname">{{ userInfo.nickName }}</p>
    </div>

    <!-- 登录按钮 -->
    <button v-if="!userEntity" class="login-btn" open-type="getUserInfo" @getuserinfo="onGotUserInfo">
      <img src="https://img.icons8.com/?size=100&id=26149&format=png&color=000000" alt="微信图标" class="wechat-icon"/>
      微信登录
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {baseUrl} from "@/router";

// 定义响应式数据
const openid = ref("");
const loginstate = ref("0");
const userEntity = ref(null);
const terminal = ref("");
const osVersion = ref("");
const phoneNumber = ref("");
const showModal = ref(false);
const userInfo = ref(null);

// 加载存储数据
const loadStorageData = async () => {
  try {
    // 获取 openid
    const openidRes = await uni.getStorage({ key: 'openid' });
    openid.value = openidRes.data || "";
    console.log("openid:" + openid.value);

    // 获取 userEntity
    const userEntityRes = await uni.getStorage({ key: 'userEntity' });
    userEntity.value = userEntityRes.data || null;

    // 获取 loginstate
    const loginstateRes = await uni.getStorage({ key: 'loginstate' });
    loginstate.value = loginstateRes.data || "0";
    console.log("loginstate:" + loginstate.value);

    // 获取商家ID
    const merchantIdRes = await uni.getStorage({ key: 'merchantId' });
    if (merchantIdRes.data) {
      console.log('本地已存储的商家ID:', merchantIdRes.data);
    }
  } catch (error) {
    console.error("加载存储数据失败:", error);
  }
};

// 获取系统信息
const getSystemInfo = () => {
  uni.getSystemInfo({
    success: (res) => {
      terminal.value = res.model;
      osVersion.value = res.system;
    }
  });
};

// 封装存储逻辑
const setStorage = (key: string, data: any) => {
  return new Promise((resolve, reject) => {
    uni.setStorage({
      key,
      data,
      success: () => {
        console.log(`${key} 存储成功`);
        console.log(data);
        resolve(data);
      },
      fail: (err) => {
        console.error(`${key} 存储失败`, err);
        reject(err);
      }
    });
  });
};

// 处理获取用户信息
const onGotUserInfo = (e: { detail: { errMsg: string; userInfo: any } }) => {
  // 检查 e.detail 是否存在
  if (!e.detail) {
    console.error('未获取到用户信息详情');
    return;
  }

  if (e.detail.errMsg === "getUserInfo:ok") {
    userInfo.value = e.detail.userInfo;
    setStorage('userinfo', e.detail.userInfo)
        .then(() => {
          console.log('userinfo 存储成功，数据为:', userInfo.value);
          showDialogBtn();
        })
        .catch(() => {
          // 存储失败时可以选择不弹出弹窗
        });
  }
};

// 显示弹窗
const showDialogBtn = () => {
  showModal.value = true;
};

// 隐藏弹窗
const hideModal = () => {
  showModal.value = false;
};

// 登录处理
const onshow = async (openidVal: string, userInfoVal: any, phoneNumberVal: string) => {
  try {
    if (!userInfoVal || !phoneNumberVal) {
      console.error('userInfoVal 或 phoneNumberVal 为空', userInfoVal, phoneNumberVal);
      return;
    }

    const requestData = {
      username: phoneNumberVal,
      parentuser: 'xudeihai',
      wximg: userInfoVal.avatarUrl,
      nickname: userInfoVal.nickName,
      identity: "",
      terminal: terminal.value,
      osVersion: osVersion.value,
      logintype: "10",
      openid: openidVal,
    };

    const res = await uni.request({
      url: baseUrl + '/shop/login',
      method: 'POST',
      data: requestData
    });


    if (
        res.data &&
        res.data.code === 200 &&
        res.data.data &&
        typeof res.data.data === 'object'
    ) {
      userEntity.value = res.data.data;

      // 存储完整用户信息
      await setStorage("userEntity", res.data.data);
      console.log('res.data.data:', res.data.data);

      // 提取并存储商家ID
      const merchantId = res.data.data?.shop?.id;
      if (merchantId) {
        await setStorage('merchantId', merchantId);
        console.log('商家ID存储成功:', merchantId);
      } else {
        console.warn('用户数据中未找到商家ID，可能不是商家账号');
      }

      // 存储登录状态
      loginstate.value = "1";
      await setStorage("loginstate", "1");

      // 如果返回中有token，则存储token
      if (res.data.data.token) {
        await setStorage("token", res.data.data.token);
      }

      // 跳转页面
      await uni.switchTab({
        url: '/pages/my/my'
      });
    } else {
      console.log('登录失败，响应数据:', res.data);
    }
  } catch (error) {
    console.error("登录失败:", error);
  }
};

// 获取手机号
const getPhoneNumber = async (e: any) => {
  try {
    if (!e.detail || !e.detail.encryptedData || !e.detail.iv) {
      console.error('获取手机号事件详情缺失必要数据', e.detail);
      return;
    }

    hideModal();

    // 获取 openid 和 sessionkey
    const loginRes = await uni.login();
    const authRes = await uni.request({
      url: baseUrl + '/shop/getopenid',
      method: 'POST',
      data: { code: loginRes.code }
    });

    setStorage('userinfo', authRes.data.data)
        .then(() => {
          console.log('userinfo 存储成功，数据为:', authRes.data.data);
          showDialogBtn();
        })
        .catch(() => {
          // 存储失败时可以选择不弹出弹窗
        });

    if (authRes.data.code !== 200 || !authRes.data.data) {
      throw new Error('获取 openid 失败');
    }

    const { openid: sessionOpenid, sessionkey } = authRes.data.data;

    // 解密手机号
    const decryptRes = await uni.request({
      url: baseUrl + '/shop/getphone',
      method: 'POST',
      data: {
        encryptedData: e.detail.encryptedData,
        iv: e.detail.iv,
        code: sessionkey
      }
    });

    if (decryptRes.data.code !== 200 || !decryptRes.data.data) {
      console.error('解密手机号失败:', decryptRes);
      uni.showToast({
        title: '解密手机号失败',
        icon: 'none'
      });
      throw new Error('解密手机号失败');
    }

    const phoneNumber = decryptRes.data.data.phoneNumber;

    // 登录
    await onshow(sessionOpenid, userInfo.value, phoneNumber);
    uni.$emit('refreshOrderList');
    console.log("登录成功");
  } catch (error) {
    console.error("获取手机号失败:", error);
  }
};

// 获取 code
const getcode = () => {
  console.log("获取code");
};

// 组件挂载时执行
onMounted(() => {
  loadStorageData();
  getSystemInfo();
});
</script>


<style>
/* 全局样式 */
body {
  font-family: 'Microsoft YaHei', sans-serif;
  background-color: #f5f5f5;
  margin: 0;
  padding: 0;
}

.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

/* 登录弹窗 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 400px;
  position: relative;
}

.close-btn {
  position: absolute;
  right: 15px;
  top: 15px;
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  transition: color 0.3s;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 40px 30px;
  text-align: center;
}

.modal-body h2 {
  color: #333;
  margin-bottom: 20px;
}

.phone-btn, .login-btn {
  background-color: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  transition: background-color 0.3s;
}

.phone-btn:hover, .login-btn:hover {
  background-color: #06a754;
}

.wechat-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
}

/* 用户信息展示 */
.user-info {
  text-align: center;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 15px;
}

.nickname {
  font-size: 20px;
  color: #333;
  font-weight: 500;
}

.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

/* 登录弹窗 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  /* 添加 z-index 属性，设置较大的值 */
  z-index: 9999;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
}
</style>