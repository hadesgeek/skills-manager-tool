<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
        <div 
          ref="modalContent"
          class="modal-content" 
          :class="{ 'resizable': resizable }"
          :style="modalStyle"
        >
          <slot></slot>
          <!-- 调整大小的拖拽手柄 -->
          <div 
            v-if="resizable" 
            class="resize-handle"
            @mousedown="startResize"
          ></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  width: {
    type: String,
    default: '480px'
  },
  resizable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const modalContent = ref<HTMLElement | null>(null)
const currentWidth = ref<number>(0)
const currentHeight = ref<number>(0)
const isResizing = ref(false)

const modalStyle = computed(() => {
  if (currentWidth.value > 0) {
    return {
      width: `${currentWidth.value}px`,
      height: currentHeight.value > 0 ? `${currentHeight.value}px` : 'auto'
    }
  }
  return { width: props.width }
})

const closeModal = () => {
  emit('update:modelValue', false)
  emit('close')
}

const startResize = (e: MouseEvent) => {
  if (!modalContent.value) return
  
  isResizing.value = true
  const startX = e.clientX
  const startY = e.clientY
  const startWidth = modalContent.value.offsetWidth
  const startHeight = modalContent.value.offsetHeight
  
  const onMouseMove = (e: MouseEvent) => {
    if (!isResizing.value) return
    
    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY
    
    currentWidth.value = Math.max(400, startWidth + deltaX)
    currentHeight.value = Math.max(300, startHeight + deltaY)
  }
  
  const onMouseUp = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  position: relative;
}

.modal-content.resizable {
  resize: none;
}

/* 调整大小手柄 */
.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
  z-index: 10;
}

.resize-handle::after {
  content: '';
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 12px;
  height: 12px;
  border-right: 2px solid #cbd5e0;
  border-bottom: 2px solid #cbd5e0;
}

/* 简单的过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
}
</style>
