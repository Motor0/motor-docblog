# 没有自动生成侧边栏是的sidebar

```javascript
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
            { text: "HTML", link: "/frontent/three/HTML5" },
            { text: "CSS", link: "/frontent/three/CSS" },
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
```

## 开启了自动生成侧边栏

**需要每个子目录中都有index.md文件**

**config.mjs**

```js
import { defineConfig } from 'vitepress'
import fs from 'fs'
import path from 'path'


// 自动生成 sidebar
function getSidebar(dirPath, title) {
  const fullPath = path.resolve(process.cwd(), 'docs', dirPath)

  if (!fs.existsSync(fullPath)) {
    console.warn(`目录不存在: ${fullPath}`)
    return []
  }

  const files = fs.readdirSync(fullPath)
    .filter(file => file.endsWith('.md'))   // 只处理 md 文件
    .map(file => {
      const name = file.replace('.md', '')
      return {
        text: name === 'index' ? title : name.toUpperCase(),
        link: `/${dirPath}/${name}`
      }
    })

  return [
    {
      text: title,
      items: files
    }
  ]
}


export default defineConfig({
  title: "My Awesome Project",
  description: "Be Water,My friends",

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      // { text: 'Examples', link: '/markdown-examples' },

      {
        text: 'Python',
        items: [
          { text: 'advance', link: '/python/advance/' },
          { text: 'base', link: '/python/base/' }
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
          { text: 'databases', link: '/backend/databases/' },
          { text: 'language', link: '/backend/language/' },
        ]
      }
    ],

    // 🔥 自动生成侧边栏
    sidebar: {
      // backend
      '/backend/databases/': getSidebar('backend/databases', '数据库'),
      '/backend/language/': getSidebar('backend/language', '语言'),

      // frontent
      '/frontent/frame/': getSidebar('frontent/frame', '框架'),
      '/frontent/three/': getSidebar('frontent/three', '三件套'),

      // python
      '/python/advance/': getSidebar('python/advance', 'Python 进阶'),
      '/python/base/': getSidebar('python/base', 'Python 基础'),
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})

```

## 去掉 index.md 出现在侧边栏的问题解决
**不过中间会先跳转到index页面才会转到对应标题内容那里,而且新添加的目录需要再 SCAN_MAP变量中添加对应路径，方便生成**

```js
// docs/.vitepress/config.mjs
import { defineConfig } from 'vitepress'
import fs from 'fs'
import path from 'path'

/**
 * 你的网站目录对应关系（与 nav 一致）
 * routePrefix 是路径前缀
 * dir 是目录
 */
const SCAN_MAP = [
  { routePrefix: '/backend/databases/', dir: 'backend/databases', title: '数据库' },
  { routePrefix: '/backend/language/', dir: 'backend/language', title: '语言' },

  { routePrefix: '/frontent/frame/', dir: 'frontent/frame', title: '框架' },
  { routePrefix: '/frontent/three/', dir: 'frontent/three', title: '三件套' },

  { routePrefix: '/python/advance/', dir: 'python/advance', title: 'Python 进阶' },
  { routePrefix: '/python/base/', dir: 'python/base', title: 'Python 基础' },

  { routePrefix: '/module/gj/', dir: 'module/gj', title: '公安基础知识' },
  { routePrefix: '/module/xc/', dir: 'module/xc', title: '行测' },
]

/** 读取 md 文件列表 */
function readMdList(dir) {
  const full = path.resolve(process.cwd(), 'docs', dir)
  if (!fs.existsSync(full)) return []
  return fs.readdirSync(full)
    .filter(f => f.endsWith('.md'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

/**  强制覆盖生成虚拟 index.md */
/** ⭐ 强制覆盖生成虚拟 index.md（无提示语） */
function ensureIndexFile(dir) {
  const fullDir = path.resolve(process.cwd(), 'docs', dir)
  if (!fs.existsSync(fullDir)) return

  const mdList = readMdList(dir).filter(f => f !== 'index.md')
  if (mdList.length === 0) return

  const indexPath = path.join(fullDir, 'index.md')

  const first = mdList[0].replace('.md', '')
  const target = `/${dir}/${first}`.replace(/\\/g, '/')

  const content = `---
sidebar: false
---

<!-- 自动生成的虚拟 index（重定向到 ${target}） -->
<meta http-equiv="refresh" content="0; url=${target}" />
<script>
  if (typeof window !== 'undefined') {
    window.location.replace('${target}')
  }
</script>
`
  fs.writeFileSync(indexPath, content, 'utf8')
  console.log(`index.md 已覆盖 → ${indexPath} 指向 ${target}`)
}


/** 从文件名转标题，可按需美化 */
function formatTitle(name) {
  return name.toUpperCase()
}

/** 自动生成 sidebar，忽略 index.md */
function makeSidebarEntry(dir, title) {
  const mdList = readMdList(dir)
  if (mdList.length === 0) return []

  const items = mdList
    .filter(f => f !== 'index.md') //  index.md 永远不出现在 sidebar
    .map(f => {
      const name = f.replace('.md', '')
      const link = `/${dir}/${name}`.replace(/\\/g, '/')
      return { text: formatTitle(name), link }
    })

  return [{ text: title, items }]
}

/** 启动前执行：为目录创建（覆盖）虚拟 index.md */
function prepareVirtualIndexes() {
  for (const item of SCAN_MAP) {
    ensureIndexFile(item.dir)
  }
}
prepareVirtualIndexes()

/** 最终 sidebar 对象 */
const sidebarObj = {}
for (const item of SCAN_MAP) {
  sidebarObj[item.routePrefix] = makeSidebarEntry(item.dir, item.title)
}

export default defineConfig({
  title: "My Awesome Project",
  description: "Be Water,My friends",

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      // { text: 'Examples', link: '/markdown-examples' },

      {
        text: 'Python',
        items: [
          { text: 'advance', link: '/python/advance/' },
          { text: 'base', link: '/python/base/' },
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
          { text: 'databases', link: '/backend/databases/' },
          { text: 'language', link: '/backend/language/' },
        ]
      },
      {
        text: '摸斗法',
        items: [
          { text: '公安基础知识', link: '/module/gj/' },
          { text: '行测', link: '/module/xc/' },
        ]
      }
    ],

    sidebar: sidebarObj,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})


```

## 能够识别多个层次的目录

```js
// docs/.vitepress/config.mjs
import { defineConfig } from 'vitepress'
import fs from 'fs'
import path from 'path'

/**
 * 你的网站目录对应关系（与 nav 一致）
 */
const SCAN_MAP = [
  { routePrefix: '/backend/databases/', dir: 'backend/databases', title: '数据库' },
  { routePrefix: '/backend/language/', dir: 'backend/language', title: '语言' },

  { routePrefix: '/frontent/frame/', dir: 'frontent/frame', title: '框架' },
  { routePrefix: '/frontent/three/', dir: 'frontent/three', title: '三件套' },

  { routePrefix: '/python/advance/', dir: 'python/advance', title: 'Python 进阶' },
  { routePrefix: '/python/base/', dir: 'python/base', title: 'Python 基础' },

  { routePrefix: '/module/gj/', dir: 'module/gj', title: '公安基础知识' },
  { routePrefix: '/module/xc/', dir: 'module/xc', title: '行测' },
]

/** 从文件名/文件夹名转标题，可在此自定义逻辑（去除数字前缀等） */
function formatTitle(name) {
  // 举例：去除 "01-" 这种前缀，并将剩余部分大写
  // return name.replace(/^\d+[-_]/, '').toUpperCase()
  return name.toUpperCase()
}

/** * 核心递归扫描函数 
 * @param {string} fullDir 当前扫描的物理绝对路径
 * @param {string} routeBase 当前路径对应的路由前缀 (如 /backend/databases/)
 */
function scanDir(fullDir, routeBase) {
  if (!fs.existsSync(fullDir)) return []

  const items = fs.readdirSync(fullDir).sort((a, b) => {
    return a.localeCompare(b, undefined, { numeric: true })
  })

  const result = []

  for (const item of items) {
    // 忽略 index.md, .DS_Store 等隐藏文件
    if (item === 'index.md' || item.startsWith('.')) continue

    const itemPath = path.join(fullDir, item)
    const stat = fs.statSync(itemPath)

    if (stat.isDirectory()) {
      // === 如果是文件夹：递归处理 ===
      // 拼接下一级路由
      const nextRoute = `${routeBase}${item}/`.replace(/\/+/g, '/')
      const subItems = scanDir(itemPath, nextRoute)

      // 只有文件夹下有内容才添加
      if (subItems.length > 0) {
        result.push({
          text: formatTitle(item),
          items: subItems,
          collapsed: false // 设置为 true 则默认收起
        })
      }
    } else if (item.endsWith('.md')) {
      // === 如果是 Markdown 文件 ===
      const name = item.replace('.md', '')
      const link = `${routeBase}${name}`.replace(/\/+/g, '/')

      result.push({
        text: formatTitle(name),
        link: link
      })
    }
  }

  return result
}

/** 辅助函数：从嵌套的 sidebar 数组中找到第一个有效的 link */
function findFirstLink(items) {
  for (const item of items) {
    if (item.link) return item.link
    if (item.items && item.items.length > 0) {
      const deepLink = findFirstLink(item.items)
      if (deepLink) return deepLink
    }
  }
  return null
}

/** * 强制覆盖生成虚拟 index.md 
 * 改进版：现在会根据递归结果找到第一个真实链接进行跳转
 */
function ensureIndexFile(dir, sidebarItems) {
  const fullDir = path.resolve(process.cwd(), 'docs', dir)
  if (!fs.existsSync(fullDir)) return

  // 尝试找到树结构中的第一个链接
  const targetLink = findFirstLink(sidebarItems)

  // 如果整个目录下没有任何 md 文件，则不生成 index
  if (!targetLink) return

  const indexPath = path.join(fullDir, 'index.md')

  const content = `---
sidebar: false
layout: false
---

<meta http-equiv="refresh" content="0; url=${targetLink}" />
<script>
  if (typeof window !== 'undefined') {
    window.location.replace('${targetLink}')
  }
</script>
`
  fs.writeFileSync(indexPath, content, 'utf8')
  // console.log(`索引覆盖: ${indexPath} -> ${targetLink}`)
}

/** 构建 Sidebar 对象 */
const sidebarObj = {}

// 预先执行扫描
for (const item of SCAN_MAP) {
  const fullDir = path.resolve(process.cwd(), 'docs', item.dir)

  // 1. 递归扫描获取结构
  const items = scanDir(fullDir, item.routePrefix)

  // 2. 如果该目录下有内容，生成 Sidebar 入口
  if (items.length > 0) {
    sidebarObj[item.routePrefix] = [
      {
        text: item.title,
        items: items
      }
    ]
    // 3. 确保 index.md 能够正确跳转到第一个文件（无论多深）
    ensureIndexFile(item.dir, items)
  }
}

export default defineConfig({
  title: "My Awesome Project",
  description: "Be Water, My friends",

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Python',
        items: [
          { text: 'advance', link: '/python/advance/' },
          { text: 'base', link: '/python/base/' },
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
          { text: 'databases', link: '/backend/databases/' },
          { text: 'language', link: '/backend/language/' },
        ]
      },
      {
        text: '摸斗法',
        items: [
          { text: '公安基础知识', link: '/module/gj/' },
          { text: '行测', link: '/module/xc/' },
        ]
      }
    ],

    sidebar: sidebarObj,

    outline: {
      level: [2, 4]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
```

## 能够识别多个层次的目录侧边栏，并且能无缝跳转

```js
// docs/.vitepress/config.mjs
import { defineConfig } from 'vitepress'
import fs from 'fs'
import path from 'path'

const SCAN_MAP = [
  { routePrefix: '/backend/databases/', dir: 'backend/databases', title: '数据库' },
  { routePrefix: '/backend/language/', dir: 'backend/language', title: '语言' },

  { routePrefix: '/frontent/frame/', dir: 'frontent/frame', title: '框架' },
  { routePrefix: '/frontent/three/', dir: 'frontent/three', title: '三件套' },

  { routePrefix: '/python/advance/', dir: 'python/advance', title: 'Python 进阶' },
  { routePrefix: '/python/base/', dir: 'python/base', title: 'Python 基础' },

  { routePrefix: '/module/gj/', dir: 'module/gj', title: '公安基础知识' },
  { routePrefix: '/module/xc/', dir: 'module/xc', title: '行测' },
]

/** 格式化标题 */
function formatTitle(name) {
  return name.toUpperCase()
}

/** 递归扫描目录 */
function scanDir(fullDir, routeBase) {
  if (!fs.existsSync(fullDir)) return []

  const items = fs.readdirSync(fullDir).sort((a, b) => {
    return a.localeCompare(b, undefined, { numeric: true })
  })

  const result = []

  for (const item of items) {
    if (item === 'index.md' || item.startsWith('.')) continue

    const itemPath = path.join(fullDir, item)
    const stat = fs.statSync(itemPath)

    if (stat.isDirectory()) {
      const nextRoute = `${routeBase}${item}/`.replace(/\/+/g, '/')
      const subItems = scanDir(itemPath, nextRoute)
      if (subItems.length > 0) {
        result.push({
          text: formatTitle(item),
          items: subItems,
          collapsed: false
        })
      }
    } else if (item.endsWith('.md')) {
      const name = item.replace('.md', '')
      const link = `${routeBase}${name}`.replace(/\/+/g, '/')
      result.push({ text: formatTitle(name), link })
    }
  }
  return result
}

/** 查找第一个有效链接 */
function findFirstLink(items) {
  for (const item of items) {
    if (item.link) return item.link
    if (item.items && item.items.length > 0) {
      const deepLink = findFirstLink(item.items)
      if (deepLink) return deepLink
    }
  }
  return null
}

/** * 生成虚拟 index.md (作为后备方案)
 * 防止用户手动输入目录 URL 时 404
 */
function ensureIndexFile(dir, targetLink) {
  if (!targetLink) return
  const fullDir = path.resolve(process.cwd(), 'docs', dir)
  if (!fs.existsSync(fullDir)) return

  const indexPath = path.join(fullDir, 'index.md')
  const content = `---
sidebar: false
layout: false
---
<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vitepress'

const router = useRouter()
onMounted(() => {
  router.go('${targetLink}')
})
</script>
`
  fs.writeFileSync(indexPath, content, 'utf8')
}

// === 主逻辑开始 ===

const sidebarObj = {}
// 用来存储每个板块的“第一个真实链接”，用于替换 nav
const routeFirstLinkMap = {}

for (const item of SCAN_MAP) {
  const fullDir = path.resolve(process.cwd(), 'docs', item.dir)
  const items = scanDir(fullDir, item.routePrefix)

  if (items.length > 0) {
    sidebarObj[item.routePrefix] = [{ text: item.title, items: items }]

    // 找到该模块的第一个文章链接
    const firstLink = findFirstLink(items)
    if (firstLink) {
      routeFirstLinkMap[item.routePrefix] = firstLink
      // 仍然生成 index.md 以防万一（外部链接跳转目录时用）
      ensureIndexFile(item.dir, firstLink)
    }
  }
}

/** * 辅助函数：获取 nav 跳转链接
 * 如果扫描到了第一个文件，就直接跳过去；否则还是跳目录
 */
function getNavLink(prefix) {
  return routeFirstLinkMap[prefix] || prefix
}

export default defineConfig({
  title: "My Awesome Project",
  description: "Be Water, My friends",

  themeConfig: {
    // 这里的 link 全部动态获取，实现了点击导航栏直接进入文章，无缝隙
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Python',
        items: [
          { text: 'advance', link: getNavLink('/python/advance/') },
          { text: 'base', link: getNavLink('/python/base/') },
        ]
      },
      {
        text: '前端',
        items: [
          { text: '框架', link: getNavLink('/frontent/frame/') },
          { text: '三件套', link: getNavLink('/frontent/three/') },
        ]
      },
      {
        text: '后端',
        items: [
          { text: 'databases', link: getNavLink('/backend/databases/') },
          { text: 'language', link: getNavLink('/backend/language/') },
        ]
      },
      {
        text: '摸斗法',
        items: [
          { text: '公安基础知识', link: getNavLink('/module/gj/') },
          { text: '行测', link: getNavLink('/module/xc/') },
        ]
      }
    ],

    sidebar: sidebarObj,

    outline: {
      level: [2, 4]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
```

