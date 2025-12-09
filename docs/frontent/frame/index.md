---
sidebar: false
layout: false
---
<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vitepress'

const router = useRouter()
onMounted(() => {
  router.go('/frontent/frame/react')
})
</script>
