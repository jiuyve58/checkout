<script>
  import config from '@/admin.config.js';
  import { authApi } from '@/utils/admin-api.js';

  export default {
    created() {
      this.clear = undefined;
    },
    onPageNotFound(msg) {
      uni.redirectTo({
        url: config.error.url,
      });
    },
    onLaunch: function () {
      // #ifdef H5
      console.log(
        `%c 图书管理后台 %c 已启动 `,
        'background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff',
        'background:#007aff ;padding: 1px; border-radius: 0 3px 3px 0;  color: #fff; font-weight: bold;'
      );
      // #endif

      // 登录态校验：未登录则跳转登录页
      if (!authApi.isLogin()) {
        const currentPath = window.location.pathname + window.location.hash;
        if (currentPath.indexOf(config.login.url) === -1 && currentPath.indexOf('/pages/error') === -1) {
          uni.reLaunch({ url: config.login.url });
        }
      }

      console.log('App Launch');
    },
    onShow: function () {
      console.log('App Show');
    },
    onHide: function () {
      console.log('App Hide');
    },
  };
</script>

<style lang="scss">
  @import '@/common/uni.css';
  @import '@/common/uni-icons.css';
  @import '@/common/admin-icons.css';
  @import '@/common/theme.scss';
</style>
