<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="name" label="分类名称" required>
        <uni-easyinput placeholder="分类名称" v-model="formData.name"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="sort" label="排序权重">
        <uni-easyinput placeholder="排序权重，数字越小越靠前" type="number" v-model="formData.sort"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="enabled" label="是否启用">
        <switch @change="binddata('enabled', $event.detail.value)" :checked="formData.enabled"></switch>
      </uni-forms-item>
      <view class="uni-button-group">
        <button type="primary" class="uni-button" style="width: 100px;" @click="submit">提交</button>
        <navigator open-type="navigateBack" style="margin-left: 15px;">
          <button class="uni-button" style="width: 100px;">返回</button>
        </navigator>
      </view>
    </uni-forms>
  </view>
</template>

<script>
  import { validator } from '../../js_sdk/validator/coffee-categories.js';
  import { categoriesApi } from '../../utils/admin-api.js';

  function getValidator(fields) {
    let result = {}
    for (let key in validator) {
      if (fields.includes(key)) {
        result[key] = validator[key]
      }
    }
    return result
  }

  export default {
    data() {
      let formData = {
        "name": "",
        "sort": 0,
        "enabled": true
      }
      return {
        formData,
        formOptions: {},
        rules: {
          ...getValidator(Object.keys(formData))
        }
      }
    },
    onReady() {
      this.$refs.form.setRules(this.rules)
    },
    methods: {
      submit() {
        uni.showLoading({ mask: true });
        this.$refs.form.validate().then((res) => {
          return this.submitForm(res);
        }).catch(() => {
        }).finally(() => {
          uni.hideLoading();
        });
      },
      submitForm(value) {
        return categoriesApi.create(value).then((res) => {
          uni.showToast({ title: '新增成功' });
          this.getOpenerEventChannel().emit('refreshData');
          setTimeout(() => uni.navigateBack(), 500);
        }).catch((err) => {
          uni.showModal({
            content: err.message || '请求服务失败',
            showCancel: false
          });
        });
      }
    }
  }
</script>
