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
import { ref, onMounted } from 'vue';
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
    uni.getStorage({
      key: 'openid',
      success: (res) => {
        openid.value = res.data || "";
        console.log("openid:"+openid.value);
      },
      fail: (err) => {
        if (!err.errMsg.includes('data not found')) {
          console.error("获取 openid 失败:", err);
        }
        getcode();
      }
    });

    // 获取 userEntity
    uni.getStorage({
      key: 'userEntity',
      success: (res) => {
        userEntity.value = res.data || null;
      },
      fail: (err) => {
        if (!err.errMsg.includes('data not found')) {
          console.error("获取 userEntity 失败:", err);
        }
      }
    });

    // 获取 loginstate
    uni.getStorage({
      key: 'loginstate',
      success: (res) => {
        loginstate.value = res.data || "0";
        console.log("loginstate:"+loginstate.value);
      },
      fail: (err) => {
        if (!err.errMsg.includes('data not found')) {
          console.error("获取 loginstate 失败:", err);
        }
      }
    });
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

    uni.request({
      url: baseUrl + '/shop/login',
      method: 'POST',
      data: requestData,
      success: (res) => {
        if (
          typeof res.data === 'object' &&
          res.data !== null &&
          'code' in res.data &&
          res.data.code === 200 &&
          'data' in res.data &&
          typeof res.data.data === 'object' &&
          res.data.data !== null
        ) {
          userEntity.value = res.data.data;
          uni.setStorage({
            key: "userEntity",
            data: res.data.data,
            success: () => {
              console.log(res.data)
              console.log('userEntity 存储成功');
              // 使用 uni.switchTab 跳转到 TabBar 页面
              uni.switchTab({
                url: '/pages/my/my' // 请确保路径正确
              });
            },
            fail: (err) => {
              console.error('userEntity 存储失败', err);
            }
          });
        } else {
          console.log('响应数据不符合条件，响应数据:', res.data);
        }
        loginstate.value = "1";
        uni.setStorage({
          key: "loginstate",
          data: "1",
          success: () => {
            console.log('loginstate 存储成功');
          },
          fail: (err) => {
            console.error('loginstate 存储失败', err);
          }
        });
        uni.setStorage({
          key: 'userinfo',
          data: "1",
          success: () => {
            console.log('userinfo 存储成功');
            console.log("sssssssss"+userInfo.value);
          },
          fail: (err) => {
            console.error('userinfo 存储失败', err);
          }
        });
      },
      fail: (error) => {
        console.error("登录请求失败:", error);
      }
    });
  } catch (error) {
    console.error("登录失败:", error);
  }
};

// 获取手机号
const getPhoneNumber = async (e: any) => {
  try {
    // 检查 e.detail 是否存在
    if (!e.detail || !e.detail.encryptedData || !e.detail.iv) {
      console.error('获取手机号事件详情缺失必要数据', e.detail);
      return;
    }

    hideModal();

    // 模拟微信的checkSession
    const sessionValid = true; // 实际项目中需要实现会话检查

    // 封装获取 openid 和 sessionkey 的逻辑
    const getOpenIdAndSessionKey = async () => {
      const loginRes = await uni.login();
      const getOpenIdData = {
        code: loginRes.code
      };
      console.log('发送到后端的 openid 数据:', getOpenIdData);
      return new Promise<{ openid: string; sessionkey: string }>((resolve, reject) => {
        uni.request({
          url: baseUrl + '/shop/getopenid',
          method: 'POST',
          data: getOpenIdData,
          success: (authRes) => {
            // 打印完整响应数据
            console.log('后端返回的 openid 响应数据:', authRes.data);
            if (
              typeof authRes.data === 'object' &&
              authRes.data !== null &&
              'code' in authRes.data &&
              authRes.data.code === 200 &&
              'data' in authRes.data &&
              typeof authRes.data.data === 'object' &&
              authRes.data.data !== null &&
              'openid' in authRes.data.data &&
              'sessionkey' in authRes.data.data
            ) {
              const openid = authRes.data.data.openid;
              const sessionkey = authRes.data.data.sessionkey;
              resolve({ openid, sessionkey });
            } else {
              reject(new Error('获取 openid 或 sessionkey 失败'));
            }
          },
          fail: (error) => {
            reject(new Error('获取登录凭证失败: ' + error.errMsg));
          }
        });
      });
    };

    // 封装解密手机号的逻辑
    const decryptPhoneNumber = async (sessionkey: string) => {
      const getPhoneData = {
        encryptedData: e.detail.encryptedData,
        iv: e.detail.iv,
        code: sessionkey
      };
      console.log('发送到后端的获取手机号数据:', getPhoneData);
      return new Promise<string>((resolve, reject) => {
        uni.request({
          url: baseUrl + '/shop/getphone',
          method: 'POST',
          data: getPhoneData,
          success: (decryptRes) => {
            // 打印完整响应数据
            console.log('后端返回的解密手机号响应数据:', decryptRes.data);
            if (
              typeof decryptRes.data === 'object' &&
              decryptRes.data !== null &&
              'code' in decryptRes.data &&
              decryptRes.data.code === 200 &&
              'data' in decryptRes.data &&
              typeof decryptRes.data.data === 'object' &&
              decryptRes.data.data !== null &&
              'phoneNumber' in decryptRes.data.data
            ) {
              resolve(decryptRes.data.data.phoneNumber);
            } else {
              reject(new Error('解密手机号失败'));
            }
          },
          fail: (error) => {
            reject(new Error('解密失败: ' + error.errMsg));
          }
        });
      });
    };

    const { openid, sessionkey } = await getOpenIdAndSessionKey();
    const phoneNumber = await decryptPhoneNumber(sessionkey);

    if (!userInfo.value) {
      console.error('用户信息为空，无法调用 onshow 函数');
      return;
    }

    await onshow(openid, userInfo.value, phoneNumber);
    console.log("登录成功");
    console.log(phoneNumber);
  } catch (error) {
    console.error("获取手机号失败:", error);
  }
};

// 获取 code
const getcode = () => {
  // 实现获取code的逻辑
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