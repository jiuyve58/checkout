<script>
	import config from '@/config/index.js';
	export default {
		globalData: {
			searchText: ''
		},
		onLaunch: function() {
			console.log('App Launch')
			// #ifdef MP-WEIXIN
			if (wx.cloud) {
				wx.cloud.init({
					env: config.CLOUD_ENV,
					traceUser: true
				});
			}
			// #endif
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>
