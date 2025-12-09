import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "My Awesome Project",
  description: "Be Water,My friends",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' },
      {
        text: 'Python',
        items: [
          { text: 'advance', link: '/python/advance/ad' },
          { text: 'base', link: '/python/base/bs' },
        ]
      },
      {
        text: '前端',
        items: [
          { text: '框架', link: '/frontent/frame/' },
          { text: '三件套', link: '/frontent/three/' },
        ]
      },
      {
        text: '后端',
        items: [
          { text: 'databases', link: '/backend/databases/mysql' },
          { text: 'language', link: '/backend/language/java' },
        ]
      }
    ],

    sidebar: {
      //后端部分
      // 当用户位于 `/backend/databases/` 目录时，会显示此侧边栏
      '/backend/databases/': [
        {
          text: '数据库',
          items: [
            { text: 'MYSQL', link: '/backend/databases/mysql' }
          ]
        }
      ],
      // 当用户位于 `/langua/base/` 目录时，会显示此侧边栏
      '/backend/language/': [
        {
          text: '语言',
          items: [
            { text: 'JAVA', link: '/backend/language/java' }
          ]
        }
      ],


      //前端部分
      '/frontent/frame/': [
        {
          text: '框架',
          items: [
            { text: "框架简介", link: "/frontent/frame/" },
            { text: "VUE", link: "/frontent/frame/vue" },
            { text: "REACT", link: "/frontent/frame/react" },
          ]
        }
      ],

      '/frontent/three/': [
        {
          text: '三件套',
          items: [
            { text: "前置知识", link: "/frontent/three/" },
            { text: "HTML", link: "/frontent/three/html5" },
            { text: "CSS", link: "/frontent/three/css" },
            { text: "JAVASCRIPT", link: "/frontent/three/javascript" },
          ]
        }
      ],

      //Python 另起一路
      '/python/advance/ad': [
        {
          text: 'Python 进阶',
          items: [
            { text: "进阶内容", link: "/python/advance/ad" }
          ]
        }
      ],
      '/python/base/bs': [
        {
          text: 'Python 基础',
          items: [
            { text: "基础内容", link: "/python/base/bs" }
          ]
        }
      ]


    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
