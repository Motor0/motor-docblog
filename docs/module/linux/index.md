---
sidebar: false
layout: false
---
<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vitepress'

const router = useRouter()
onMounted(() => {
  router.go('/module/linux/关于loop虚拟快设备')
})
</script>
