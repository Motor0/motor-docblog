// docs/.vitepress/auto-gen.mjs
import fs from 'fs'
import path from 'path'

/**
 * 配置项：网站目录对应关系
 * 在这里统一管理你的目录结构
 */
const SCAN_MAP = [
    { routePrefix: '/backend/databases/', dir: 'backend/databases', title: '数据库' },
    { routePrefix: '/backend/language/', dir: 'backend/language', title: '语言' },

    { routePrefix: '/frontent/frame/', dir: 'frontent/frame', title: '框架' },
    { routePrefix: '/frontent/three/', dir: 'frontent/three', title: '三件套' },

    { routePrefix: '/python/advance/', dir: 'python/advance', title: 'Python 进阶' },
    { routePrefix: '/python/base/', dir: 'python/base', title: 'Python 基础' },

    { routePrefix: '/module/linux/', dir: 'module/linux', title: 'Linux' },
    { routePrefix: '/module/xc/', dir: 'module/xc', title: '关于部署的问题' },
]

/** 格式化标题：可在此自定义逻辑（如去除数字前缀） */
function formatTitle(name) {
    // 示例：把 "01-基础" 变成 "基础" 并大写
    return name.replace(/^\d+[-_.]/, '').toUpperCase()
}

/** 递归扫描目录生成侧边栏结构 */
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
                    collapsed: false // 默认展开，改为 true 可默认收起
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

/** 查找嵌套结构中的第一个有效链接 */
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

/** 生成虚拟 index.md (作为 URL 手动输入的兜底) */
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

// === 执行初始化逻辑 ===

const sidebarObj = {}
const routeFirstLinkMap = {}

for (const item of SCAN_MAP) {
    const fullDir = path.resolve(process.cwd(), 'docs', item.dir)
    const items = scanDir(fullDir, item.routePrefix)

    if (items.length > 0) {
        sidebarObj[item.routePrefix] = [{ text: item.title, items: items }]

        // 寻找第一个链接用于 Nav 跳转
        const firstLink = findFirstLink(items)
        if (firstLink) {
            routeFirstLinkMap[item.routePrefix] = firstLink
            ensureIndexFile(item.dir, firstLink)
        }
    }
}

/** * 导出辅助函数：获取 Nav 链接 
 * @param {string} prefix 原始目录前缀
 */
export function getNavLink(prefix) {
    return routeFirstLinkMap[prefix] || prefix
}

/** 导出最终生成的 sidebar 对象 */
export { sidebarObj }