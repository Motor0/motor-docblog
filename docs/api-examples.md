---
layout: page
title: 关于
aside: false
editLink: false
lastUpdated: false
---

<div class="about-container">
  <header class="hero-section">
    <div class="avatar-container">
      <img src="/avatar.jpg" alt="Profile" class="avatar" />
      <div class="avatar-ring"></div>
    </div>
    <h1 class="main-title">马达</h1>
    <p class="subtitle">AI-Augmented Engineer · <span class="gradient-text">Prompt-Focused Solution Architect</span></p>
    <div class="social-group">
      <a href="https://github.com/Motor0" target="_blank" class="social-btn github"><span class="vpi-social-github" style="--icon: url('https://api.iconify.design/simple-icons/github.svg');"></span> GitHub</a>
      <a href="mailto:motor0@foxmail.com" class="social-btn email"><span class="icon">✉️</span> Email</a>
    </div>
  </header>

  <div class="info-section">
    <h2 class="block-title">简介 / Summary</h2>
    <div class="bio-content">
      <p>热衷于<strong>自然语言编程 (Prompt Engineering)</strong>，喜欢吹牛</p>
    </div>
  </div>

  <div class="info-section">
    <h2 class="block-title">技术栈 / Tech Stack</h2>
    <div class="stack-grid">
      <div class="stack-card">
        <div class="card-header">Backend Engineering</div>
        <div class="tag-container">
          <span class="tag">Java / Spring Boot</span><span class="tag">Spring Security</span>
          <span class="tag">MyBatis Plus</span><span class="tag">MySQL / Redis</span>
          <span class="tag">RabbitMQ / ES</span>
        </div>
      </div>
      <div class="stack-card">
        <div class="card-header">Frontend & UI</div>
        <div class="tag-container">
          <span class="tag">Vue 3 Ecosystem</span><span class="tag">Vite / VitePress</span>
          <span class="tag">Modern JS / TS</span><span class="tag">UI Adaptation</span>
        </div>
      </div>
      <div class="stack-card">
        <div class="card-header">Security & AI Automation</div>
        <div class="tag-container">
          <span class="tag">OWASP Top 10</span><span class="tag">PoC / Exploit</span>
          <span class="tag">Python Scrapy</span><span class="tag">LLM Prompting</span>
        </div>
      </div>
      <div class="stack-card">
        <div class="card-header">DevOps & Infrastructure</div>
        <div class="tag-container">
          <span class="tag">Docker</span><span class="tag">Linux Admin</span>
          <span class="tag">Nginx / Proxy</span><span class="tag">Git CI/CD</span>
        </div>
      </div>
    </div>
  </div>

  <div class="info-section">
    <h2 class="block-title">历程 / Milestones</h2>
    <div class="milestone-list">
      <div class="milestone-item">
        <div class="ms-dot"></div>
        <div class="ms-time">2025 - PRESENT</div>
        <div class="ms-desc"><strong>深耕 AI 增强工程领域</strong><br />专注于 Prompt Engineering 与 AI 驱动的解决方案架构。探索 LLM 在自动化运维与安全防御中的实际落地应用。</div>
      </div>
      <div class="milestone-item">
        <div class="ms-dot"></div>
        <div class="ms-time">2023 - 2024</div>
        <div class="ms-desc"><strong>安全？</strong><br />踩不完的坑,一言难尽...</div>
      </div>
      <div class="milestone-item">
        <div class="ms-dot"></div>
        <div class="ms-time">2022 - 2023</div>
        <div class="ms-desc"><strong>后端起步</strong><br />进入互联网开发领域，随波逐流,在技术更迭中保持敏锐，开启对全栈及安全领域的探索。</div>
      </div>
    </div>
  </div>
</div>

<style scoped>
/* 核心容器：保持 1000px 宽度和呼吸感 */
.about-container { max-width: 1000px; margin: 0 auto; padding: 80px 40px; line-height: 1.8; color: var(--vp-c-text-1); }

/* 头部布局：解决重叠问题 */
.hero-section { text-align: center; margin-bottom: 100px; display: flex; flex-direction: column; align-items: center; }
.avatar-container { position: relative; width: 160px; height: 160px; margin-bottom: 30px; }
.avatar { width: 160px; height: 160px; border-radius: 50%; object-fit: cover; position: relative; z-index: 2; border: 4px solid var(--vp-c-bg); box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
.avatar-ring { position: absolute; top: -10px; left: -10px; right: -10px; bottom: -10px; border: 2px dashed var(--vp-c-brand); border-radius: 50%; animation: rotate 20s linear infinite; opacity: 0.5; }
@keyframes rotate { from {transform: rotate(0deg)} to {transform: rotate(360deg)} }

.main-title { font-size: 3.2rem; font-weight: 800; margin: 20px 0; line-height: 1.2; }
.gradient-text { background: linear-gradient(120deg, var(--vp-c-brand), #646cff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.subtitle { font-size: 1.25rem; color: var(--vp-c-text-2); margin-bottom: 40px; }

/* 按钮复原 */
.social-group { display: flex; justify-content: center; gap: 20px; }
.social-btn { display: flex; align-items: center; gap: 10px; padding: 12px 28px; border-radius: 999px; font-weight: 600; text-decoration: none !important; color: white !important; transition: all 0.3s ease; box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
.social-btn.github { background: linear-gradient(135deg, #24292e, #3f4448); }
.social-btn.email { background: linear-gradient(135deg, #646cff, #42b883); }
.social-btn:hover { transform: translateY(-4px); box-shadow: 0 15px 35px rgba(0,0,0,0.25); }

/* 模块间距 */
.info-section { margin-bottom: 80px; }
.block-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 30px; padding-bottom: 10px; border-bottom: 2px solid var(--vp-c-brand-soft); display: inline-block; }

.bio-content { background: var(--vp-c-bg-soft); padding: 25px; border-radius: 20px; border-left: 5px solid var(--vp-c-brand); color: var(--vp-c-text-2); }
.bio-line { margin-bottom: 8px; }

/* 技术栈网格还原 */
.stack-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 30px; }
.stack-card { padding: 30px; background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); border-radius: 20px; transition: all 0.3s ease; }
.stack-card:hover { border-color: var(--vp-c-brand); transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
.card-header { font-weight: 700; color: var(--vp-c-brand); margin-bottom: 20px; font-size: 1.1rem; }
.tag-container { display: flex; flex-wrap: wrap; gap: 12px; }
.tag { padding: 6px 14px; background: var(--vp-c-bg-mute); border-radius: 8px; font-size: 0.9rem; color: var(--vp-c-text-2); }

/* 历程列表还原 */
.milestone-item { position: relative; padding-left: 40px; padding-bottom: 40px; border-left: 2px solid var(--vp-c-divider); }
.ms-dot { position: absolute; left: -7px; top: 8px; width: 12px; height: 12px; background: var(--vp-c-brand); border-radius: 50%; box-shadow: 0 0 10px var(--vp-c-brand); }
.ms-time { font-weight: 800; font-size: 0.85rem; color: var(--vp-c-brand); margin-bottom: 5px; }
.ms-desc { color: var(--vp-c-text-1); }

@media (max-width: 768px) {
  .about-container { padding: 40px 20px; }
  .main-title { font-size: 2.2rem; }
  .stack-grid { grid-template-columns: 1fr; }
  .hero-section { margin-bottom: 60px; }
}
</style>