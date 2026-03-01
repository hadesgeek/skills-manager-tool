<template>
  <div class="skills-page">
    <header class="content-header">
      <h1 class="content-title">Skills</h1>
      <div class="header-actions">
        <button class="action-btn" @click="fetchSkills">
          <span class="icon">↻</span>
          <span class="text">刷新</span>
        </button>
        <div class="search-box">
          <input type="text" placeholder="搜索 Skills" />
        </div>
        <button class="primary-btn" @click="showModal = true">
          <span class="icon">+</span>
          <span class="text">新建 Skill</span>
        </button>
      </div>
    </header>

    <div class="skills-content">
      <p class="count-label">已激活 {{ skills.length }}</p>

      <div v-if="loading" class="loading-state">
        <p>正在加载技能...</p>
      </div>
      <div v-else-if="skills.length === 0" class="empty-state">
        <p>当前目录 ({{ skillsPath }}) 下没有发现技能，请点击右上方按钮新建。</p>
      </div>

      <div v-else class="skills-list">
        <div v-for="skill in skills" :key="skill.id" class="skill-card" @click="goToEditor(skill)">
          <div class="skill-card-top">
            <div class="skill-card-left">
              <div class="avator-mock">{{ skill.name.charAt(0).toUpperCase() }}</div>
              <div class="skill-info">
                <div class="skill-name">
                  {{ skill.name }}
                  <span class="status-dot"></span>
                </div>
                <div class="skill-desc" :title="skill.desc">{{ skill.desc }}</div>
              </div>
            </div>
            <!-- <button class="delete-btn" title="删除" @click.stop>✕</button> -->
          </div>

          <!-- <div class="skill-card-bottom">
             <span class="skill-tools">适用于 未与任何工具关联</span> 
             <button class="edit-btn" @click.stop="goToEditor(skill)">编辑</button>
          </div> --> 
        </div>
      </div>
    </div>

    <!-- 弹窗部分骨架先放在这里 -->
    <Modal v-model="showModal" width="480px">
      <div class="modal-header">
        <h2 class="modal-title">新建 Skill</h2>
        <p class="modal-subtitle">创建一个新的 Skill 文件夹</p>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>名称</label>
          <input type="text" placeholder="输入 Skill 名称" class="form-input" />
        </div>
        <div class="form-group">
          <label>描述</label>
          <textarea placeholder="输入 Skill 描述 (可选)" class="form-input textarea" rows="3"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn cancel-btn" @click="showModal = false">取消</button>
        <button class="btn primary-btn" @click="showModal = false">创建</button>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Modal from '../components/common/Modal.vue'

const router = useRouter()

interface Skill {
  id: string
  name: string
  desc: string
  path: string
}

const showModal = ref(false)

const skills = ref<Skill[]>([])
const loading = ref(false)
const skillsPath = ref('E:\\AITools\\SKillsManager\\Skills') // TODO: Read from settings later

async function fetchSkills() {
  loading.value = true
  try {
    const apiKey = localStorage.getItem('GEMINI_API_KEY') || undefined
    console.log('[SkillsManager] Fetching skills...')
    console.log('[SkillsManager] API Key from localStorage:', apiKey ? `YES (${apiKey.substring(0, 10)}...)` : 'NO')
    // @ts-ignore - Ignore type error if window.api doesn't have it defined in d.ts yet
    skills.value = await window.api.getSkills(skillsPath.value, apiKey)
  } catch (error) {
    console.error('Failed to load skills:', error)
  } finally {
    loading.value = false
  }
}

function goToEditor(skill: Skill) {
  router.push({ path: '/skill-editor', query: { path: skill.path, name: skill.name } })
}

onMounted(() => {
  fetchSkills()
})
</script>

<style scoped>
.skills-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Header */
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

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-btn {
  height: 36px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  background-color: transparent;
  color: #374151;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
}

.search-box {
  width: 180px;
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

.primary-btn {
  height: 36px;
  padding: 0 16px;
  background-color: #1F2937;
  color: #FFFFFF;
  border-radius: 8px;
  font-weight: 500;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  display: flex;
  align-items: center;
  gap: 6px;
}

.primary-btn:hover {
  background-color: #111827;
}

/* Content */
.skills-content {
  flex: 1;
  padding: 0 32px 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.count-label {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #6B7280;
  margin: 0;
}

.skills-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.loading-state,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #6B7280;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  background-color: #F9FAFB;
  border-radius: 8px;
  border: 1px dashed #E5E7EB;
}

/* Card */
.skill-card {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: #FFFFFF;
  transition: box-shadow 0.2s;
  cursor: pointer;
}

.skill-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.skill-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.skill-card-left {
  display: flex;
  gap: 12px;
}

.avator-mock {
  width: 40px;
  height: 40px;
  background-color: #EEF2FF;
  border-radius: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #6366F1;
}

.skill-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.skill-name {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 6px;
  height: 6px;
  background-color: #10B981;
  border-radius: 50%;
}

.skill-desc {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #6B7280;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.delete-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #9CA3AF;
}

.delete-btn:hover {
  background-color: #FEE2E2;
  color: #EF4444;
}

.skill-card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.skill-tools {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #9CA3AF;
}

.edit-btn {
  height: 28px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid #E5E7EB;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #374151;
}

.edit-btn:hover {
  background-color: #F9FAFB;
}

/* Modal form specifics */
.modal-header {
  padding: 32px 32px 0 32px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-title {
  margin: 0;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 20px;
  color: #1F2937;
}

.modal-subtitle {
  margin: 0;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #6B7280;
}

.modal-body {
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.form-input {
  height: 40px;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  padding: 0 12px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
}

.form-input.textarea {
  height: auto;
  padding: 12px;
  resize: vertical;
}

.form-input:focus {
  outline: none;
  border-color: #6366F1;
}

.modal-footer {
  padding: 0 32px 32px 32px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn {
  height: 40px;
  padding: 0 20px;
  background-color: #F3F4F6;
  color: #374151;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
}

.cancel-btn:hover {
  background-color: #E5E7EB;
}

.modal-footer .primary-btn {
  height: 40px;
  padding: 0 20px;
  font-size: 14px;
}
</style>
