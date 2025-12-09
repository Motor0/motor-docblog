// docs/.vitepress/config.mjs
import { defineConfig } from 'vitepress'
import { sidebarObj, getNavLink } from './auto-gen.mjs'  //自动生成侧边栏

export default defineConfig({
  title: "文档记录",
  description: "Be Water, My friends",
  base: '/motor-docblog/',

  themeConfig: {
    logo: "logo.svg",  // 站点 logo

    // 导航栏配置：使用 getNavLink 获取无缝跳转链接
    nav: [
      { text: '首页', link: '/' },
      // {
      //   text: 'Python',
      //   items: [
      //     { text: 'advance', link: getNavLink('/python/advance/') },
      //     { text: 'base', link: getNavLink('/python/base/') },
      //     // {  // 带分割线的导航栏
      //     //   items: [
      //     //     { text: "MySql", link: "/mysql/" },
      //     //     { text: "sqlalchemy", link: "/sqlalchemy/" },
      //     //   ],
      //     // },
      //   ]
      // },

      // {
      //   text: '前端',
      //   items: [
      //     { text: '框架', link: getNavLink('/frontent/frame/') },
      //     { text: '三件套', link: getNavLink('/frontent/three/') },
      //   ]
      // },

      // {
      //   text: '后端',
      //   items: [
      //     { text: 'databases', link: getNavLink('/backend/databases/') },
      //     { text: 'language', link: getNavLink('/backend/language/') },
      //   ]
      // },

      {
        text: 'MODULE FIVE',
        items: [
          { text: 'Linux', link: getNavLink('/module/linux/') },  //更改路由需要到auto-gen.mjs中进行对应的修改(路由修改)
          { text: '其他资料', link: getNavLink('/module/xc/') },
        ]
      }
    ],

    // 侧边栏配置：直接使用生成的对象
    sidebar: sidebarObj,

    //目录层级显示
    outline: {
      level: [2, 4]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ],

    footer: {
      message: '测试使用静态站点生成器',
      copyright: 'Copyright © 2019-present Evan You'
    }
  }
})
