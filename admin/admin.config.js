export default {
  login: {
    url: '/pages/login/login', // 自定义登录页
  },
  index: {
    url: '/pages/index/index', // 登录后跳转的第一个页面
  },
  error: {
    url: '/pages/error/404', // 404 Not Found 错误页面路径
  },
  navBar: {
    logo: '/static/logo.png',
    langs: [
      { text: '中文简体', lang: 'zh-Hans' },
    ],
    themes: [
      { text: '默认', value: 'default' },
      { text: '绿柔', value: 'green' },
    ],
    debug: {
      enable: process.env.NODE_ENV !== 'production',
      engine: [
        { name: '百度', url: 'https://www.baidu.com/baidu?wd=ERR_MSG' },
        { name: '谷歌', url: 'https://www.google.com/search?q=ERR_MSG' },
      ],
    },
  },
  sideBar: {
    staticMenu: [],
  },
};
