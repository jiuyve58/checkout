<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="name" label="图书名称" required>
        <uni-easyinput placeholder="图书名称" v-model="formData.name"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="author" label="作者">
        <uni-easyinput placeholder="作者" v-model="formData.author"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="code" label="图书编号">
        <uni-easyinput placeholder="图书编号" v-model="formData.code"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="year" label="出版年份">
        <uni-easyinput placeholder="出版年份" type="number" v-model="formData.year"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="description" label="内容简介">
        <uni-easyinput placeholder="内容简介" v-model="formData.description"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="price" label="借阅价格" required>
        <uni-easyinput placeholder="借阅价格" type="number" v-model="formData.price"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="image" label="图书封面">
        <view class="image-uploader">
          <view class="image-preview" v-if="imageFullUrl">
            <image :src="imageFullUrl" mode="aspectFill" class="preview-img" @click="previewImage"></image>
          </view>
          <view class="image-placeholder" v-else @click="chooseImage">
            <text class="placeholder-icon">+</text>
            <text class="placeholder-text">点击上传封面</text>
          </view>
          <view class="image-actions">
            <button class="upload-btn" size="mini" type="primary" :disabled="uploading" @click="chooseImage">
              {{ uploading ? '上传中...' : '选择图片' }}
            </button>
            <button class="remove-btn" size="mini" type="warn" v-if="formData.image" @click="removeImage">移除</button>
          </view>
          <text class="image-path" v-if="formData.image">路径：{{ formData.image }}</text>
        </view>
      </uni-forms-item>
      <uni-forms-item name="category_id" label="所属分类" required>
        <uni-easyinput placeholder="所属分类ID" v-model="formData.category_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="on_sale" label="是否可借">
        <switch @change="binddata('on_sale', $event.detail.value)" :checked="formData.on_sale"></switch>
      </uni-forms-item>
      <uni-forms-item name="rating" label="评分">
        <uni-easyinput placeholder="评分(0-5)" type="number" v-model="formData.rating"></uni-easyinput>
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
  import { validator } from '../../js_sdk/validator/coffee-products.js';
  import { productsApi, uploadApi } from '../../utils/admin-api.js';
  import config from '@/config/index.js';

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
        "author": "",
        "code": "",
        "year": null,
        "description": "",
        "price": null,
        "image": "",
        "category_id": "",
        "on_sale": true,
        "rating": 4.8
      }
      return {
        formData,
        formOptions: {},
        uploading: false,
        rules: {
          ...getValidator(Object.keys(formData))
        }
      }
    },
    computed: {
      imageFullUrl() {
        if (!this.formData.image) return '';
        if (this.formData.image.startsWith('http')) return this.formData.image;
        return config.API_BASE + this.formData.image;
      }
    },
    onReady() {
      this.$refs.form.setRules(this.rules)
    },
    methods: {
      binddata(key, value) {
        this.formData[key] = value;
      },
      chooseImage() {
        uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera'],
          success: async (res) => {
            const tempPath = res.tempFilePaths[0];
            this.uploading = true;
            try {
              const url = await uploadApi.uploadImage(tempPath);
              this.formData.image = url;
              uni.showToast({ title: '上传成功', icon: 'success' });
            } catch (err) {
              uni.showModal({ content: err.message || '上传失败', showCancel: false });
            } finally {
              this.uploading = false;
            }
          }
        });
      },
      removeImage() {
        this.formData.image = '';
      },
      previewImage() {
        uni.previewImage({ urls: [this.imageFullUrl] });
      },
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
        return productsApi.create(value).then((res) => {
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

<style lang="scss">
.image-uploader {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
.image-preview {
  width: 160px;
  height: 210px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e5e5;
}
.preview-img {
  width: 100%;
  height: 100%;
}
.image-placeholder {
  width: 160px;
  height: 210px;
  border: 2px dashed #d0d0d0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}
.placeholder-icon {
  font-size: 36px;
  color: #999;
  line-height: 1;
}
.placeholder-text {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}
.image-actions {
  display: flex;
  gap: 8px;
}
.upload-btn {
  font-size: 12px;
}
.remove-btn {
  font-size: 12px;
}
.image-path {
  font-size: 11px;
  color: #999;
  word-break: break-all;
}
</style>
