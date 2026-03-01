<template>
  <div class="market-page">
    <header class="content-header">
      <h1 class="content-title">Market</h1>
      <div class="header-actions">
         <div class="search-box">
          <input type="text" placeholder="搜索组件、工具和 Skill" />
        </div>
      </div>
    </header>

    <div class="market-content">
      <div class="cards-container">
        <!-- 模拟假数据 -->
         <div class="market-card" v-for="item in marketItems" :key="item.id">
            <div class="card-header">
              <div class="card-cover"></div>
              <span class="card-tag">{{ item.type }}</span>
            </div>
            <div class="card-body">
              <div class="card-title">{{ item.name }}</div>
              <div class="card-desc">{{ item.desc }}</div>
            </div>
            <div class="card-footer">
               <button class="download-btn">添加</button>
            </div>
         </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const marketItems = ref([
  { id: 1, name: 'DeepSeek MCP Provider', type: 'Tool', desc: '官方 DeepSeek 接入模型工具集合服务...' },
  { id: 2, name: 'GitHub Integration', type: 'Skill', desc: '一套完整的代码仓库管理相关技能脚本...' },
  { id: 3, name: 'File System Basics', type: 'Tool', desc: '提供基础的文件读写与搜索能力接口...' },
  { id: 4, name: 'Database Query Pro', type: 'Tool', desc: '包含常用 SQL 与 Mongo 查询工具函数...' }
])
</script>

<style scoped>
.market-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-header {
  height: 80px;
  padding: 0 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content-title {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 24px;
  color: #1F2937;
  margin: 0;
}

.search-box {
  width: 240px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  padding: 0 12px;
  display: flex;
  align-items: center;
}

.search-box input {
  border: none;
  outline: none;
  font-size: 13px;
  color: #9CA3AF;
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.market-content {
  flex: 1;
  padding: 0 32px 32px 32px;
  overflow-y: auto;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.market-card {
  border-radius: 12px;
  border: 1px solid #E5E7EB;
  background-color: #FFFFFF;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}

.market-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.card-header {
  height: 120px;
  position: relative;
}

.card-cover {
  width: 100%;
  height: 100%;
  background-color: #EEF2FF; /* Placeholder color cover */
}

.card-tag {
  position: absolute;
  top: 12px;
  right: 12px;
  background-color: #6366F1;
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}

.card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.card-title {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
}

.card-desc {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #6B7280;
  line-height: 1.5;
}

.card-footer {
  padding: 0 16px 16px 16px;
  display: flex;
  justify-content: flex-end;
}

.download-btn {
  height: 32px;
  padding: 0 16px;
  background-color: #F8F9FA;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.download-btn:hover {
  background-color: #1F2937;
  color: #FFFFFF;
  border-color: #1F2937;
}
</style>
